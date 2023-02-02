/* eslint-disable complexity */
import React, { useCallback, useState, useEffect } from 'react';
import { notification, Spin } from 'antd';
// import FormBuilder from 'ivoyant-form-builder';
import ReactTemplate from '@ivoyant/component-react-template';
import { MessageBus } from '@ivoyant/component-message-bus';
import BreadCrumb from '@ivoyant/component-breadcrumb';
import { cache } from '@ivoyant/component-cache';
import { useTemplateContext } from '@ivoyant/component-react-template';
import jsonata from 'jsonata';
import { useLocation, useHistory } from 'react-router-dom';
import get from 'lodash/get';
import FormBuilder from './FormBuilder';
import usePlugins from './usePlugins';

const getContextData = (workflow, requestTopic, transform) => {
    let responseData = {};

    MessageBus.request(requestTopic, {
        header: {
            registrationId: workflow,
            workflow,
        },
        body: {
            transform,
        },
    })
        .subscribe((respData) => {
            responseData = respData;
        })
        .unsubscribe();

    return responseData;
};

const getMessage = (userMessage, defaultMessage) => {
    if (userMessage !== undefined) {
        return userMessage;
    }

    if (defaultMessage) {
        return defaultMessage;
    }
    return undefined;
};

const sendWorkflowEvent = (workflow, event, data) => {
    MessageBus.send('WF.'.concat(workflow).concat('.').concat(event), {
        header: {
            registrationId: workflow,
            workflow,
            eventType: event,
        },
        body: data || {},
    });
};

const handleStateChange = (componentId, microflowConfig, setStatus, form) => (
    subscriptionId,
    topic,
    eventData,
    closure
) => {
    const {
        workflow,
        successStates = [],
        errorStates = [],
        onSuccess = {},
        onError = {},
    } = microflowConfig;

    const isSuccess = successStates.includes(eventData?.value);
    const isError = errorStates.includes(eventData?.value);

    if (isSuccess || isError) {
        if (isSuccess) {
            const response = eventData?.event?.data?.request?.response;
            const responseData =
                response && typeof response === 'string'
                    ? { ...JSON.parse(response) }
                    : response || {};
            setStatus({
                status: onSuccess.state,
                response: {
                    responseData,
                    formStatus: onSuccess.state,
                },
            });
        }
        if (isError) {
            const error = eventData?.event?.data;
            setStatus({
                status: onError.state,
                response: {
                    id: componentId,
                    error,
                    formStatus: 'error',
                },
            });
        }
        MessageBus.unsubscribe(subscriptionId);
    }
};

const invokeMicroflow = (
    microflowId,
    componentId,
    microflowConfig,
    options,
    form,
    datasources,
    setStatus
) => {
    const {
        workflow,
        initialize = false,
        pendingState,
        datasource,
        requestMapping,
        responseMapping,
        submitEvent = 'SUBMIT',
    } = microflowConfig;

    setStatus(pendingState);
    const subscriptionId = microflowId.concat('.').concat(subscriptionId);
    MessageBus.subscribe(
        subscriptionId,
        'WF.'.concat(workflow).concat('.STATE.CHANGE'),
        handleStateChange(componentId, microflowConfig, setStatus, form),
        {}
    );
    if (initialize) {
        MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
            header: {
                registrationId: subscriptionId,
                workflow,
                eventType: 'INIT',
            },
        });
    }

    const request = jsonata(requestMapping).evaluate({
        ...options,
        formValues: form.getFieldsValue(),
    });

    MessageBus.send('WF.'.concat(workflow).concat('.').concat(submitEvent), {
        header: {
            registrationId: subscriptionId,
            workflow,
            eventType: submitEvent,
        },
        body: {
            datasource:
                datasource && datasources ? datasources[datasource] : null,
            request,
            responseMapping,
        },
    });
};

const cacheCheckSuccess = (cacheCheck) => {
    let flag = false;
    cacheCheck.forEach((ch) => {
        if (cache.get(ch)) flag = true;
        else flag = false;
    });
    return flag;
};

const sendEventsAfterSuccess = (evaluateOnSuccess, payload) => {
    if (evaluateOnSuccess?.cacheCheck) {
        if (cacheCheckSuccess(evaluateOnSuccess?.cacheCheck))
            if (evaluateOnSuccess?.sendEvent) {
                let body = { ...evaluateOnSuccess?.body };
                Object.keys(evaluateOnSuccess?.body).forEach((bd) => {
                    if (evaluateOnSuccess?.body[bd].includes('cacheCheck')) {
                        body[bd] = cache.get(
                            evaluateOnSuccess?.cacheCheck[
                                body[bd].charAt(body[bd].length - 1)
                            ]
                        );
                    } else if (
                        evaluateOnSuccess?.body[bd].includes('payload')
                    ) {
                        body[bd] = payload?.data[evaluateOnSuccess.payload[bd]];
                    }
                });
                MessageBus.send(evaluateOnSuccess?.sendEvent, {
                    header: {
                        ...evaluateOnSuccess?.header,
                    },
                    body: {
                        ...body,
                    },
                });
                if (evaluateOnSuccess?.afterEvents) {
                    evaluateOnSuccess.afterEvents.forEach((evt) =>
                        MessageBus.send(evt)
                    );
                }
                if (
                    evaluateOnSuccess?.cacheRemove &&
                    evaluateOnSuccess?.cacheRemove.length > 0
                ) {
                    evaluateOnSuccess?.cacheRemove.forEach((ct) =>
                        cache.remove(ct)
                    );
                }
            }
    }
};

const handleAltWorkflowResponse = (successStates, errorStates) => (
    subscriptionId,
    topic,
    eventData,
    closure
) => {
    const state = eventData.value;
    const isSuccess = successStates.includes(state);
    const isFailure = errorStates.includes(state);
    if (isSuccess || isFailure) {
        if (isSuccess) {
            // show success notification
            notification.success({
                message: 'Success!',
                description: 'Lines have been restored successfully!',
            });
        }
        if (isFailure) {
            // show error message
            notification.error({
                message: 'Error!',
                description:
                    'We encountered a problem while processing your request, please try again.',
            });
        }
        // unsubscribe from events
        MessageBus.unsubscribe(subscriptionId);
    }
};

const handleResponse = (
    workflow,
    successStates,
    errorStates,
    form,
    submissionValidation,
    id,
    payload,
    templateContext,
    parentSetState,
    evaluateOnSuccess,
    routeData,
    datasources
) => (subscriptionId, topic, eventData, closure) => {
    let responseData = {};
    const isSuccess = successStates.includes(eventData?.value);
    const isError = errorStates.includes(eventData?.value);
    const altWorkflowConfig = routeData?.quickPayment?.altWorkflowConfig;
    if (isSuccess || isError) {
        const response = eventData?.event?.data?.request?.response;
        const responseMappingError = eventData?.event?.data;
        if (isError && responseMappingError) {
            responseData = responseMappingError;
            if (responseData.isError) {
                if (submissionValidation?.showErrorNotification) {
                    notification.error({
                        message: submissionValidation?.errorMessage || '',
                        description: getMessage(
                            submissionValidation?.errorDescription,
                            `${responseData.errorCode}${responseData.message}`
                        ),
                    });
                } else if (responseMappingError?.message) {
                    notification.error({
                        message: responseMappingError?.message || '',
                        description: getMessage(
                            responseData?.response?.data?.message,
                            `${responseData?.message}`
                        ),
                    });
                }
            }
        } else if (response) {
            responseData = { ...JSON.parse(response) };
            // if (altWorkflowConfig !== undefined) {
            //     // call the API withFee:false here for /bulkresume
            //     // console.log('SUCCESS config: ', { altWorkflowConfig });

            //     // init workflow
            //     MessageBus.send(
            //         'WF.'.concat(altWorkflowConfig.workflow).concat('.INIT'),
            //         {
            //             header: {
            //                 registrationId: altWorkflowConfig.workflow,
            //                 workflow: altWorkflowConfig.workflow,
            //                 eventType: 'INIT',
            //             },
            //         }
            //     );

            //     // subscribe to workflow
            //     MessageBus.subscribe(
            //         altWorkflowConfig.workflow,
            //         'WF.'
            //             .concat(altWorkflowConfig.workflow)
            //             .concat('.STATE.CHANGE'),
            //         // bulk resume response handler here
            //         handleAltWorkflowResponse(
            //             altWorkflowConfig.successStates,
            //             altWorkflowConfig.errorStates
            //         )
            //     );

            //     // send response to API
            //     MessageBus.send(
            //         'WF.'.concat(altWorkflowConfig.workflow).concat('.SUBMIT'),
            //         {
            //             header: {
            //                 registrationId: altWorkflowConfig.workflow,
            //                 workflow: altWorkflowConfig.workflow,
            //                 eventType: 'SUBMIT',
            //             },
            //             body: {
            //                 datasource:
            //                     datasources[altWorkflowConfig.datasource],
            //                 request: {
            //                     body: {
            //                         ...altWorkflowConfig.payload,
            //                     },
            //                 },
            //                 responseMapping: altWorkflowConfig.responseMapping,
            //             },
            //         }
            //     );
            // } else {
            if (submissionValidation?.showSuccessNotification) {
                notification.success({
                    message: submissionValidation?.successMessage || '',
                    description: getMessage(
                        submissionValidation?.successDescription,
                        responseData.message
                    ),
                });
            }
            // }
        }

        if (submissionValidation && submissionValidation.errors) {
            const fields = [];
            (submissionValidation.errors || []).forEach((error) => {
                if (form.getFieldValue(error.key) === error.value) {
                    fields.push(error.set);
                }
            });
            if (fields.length) {
                form.setFields(fields);

                closure.formStatusSetter({
                    status: 'error',
                    response: {
                        id,
                        ...responseData,
                        payload,
                        responseData,
                        formStatus: 'error',
                        templateContext,
                        parentSetState,
                    },
                });
            }
        }

        closure.formStatusSetter({
            status: isSuccess ? 'success' : 'error',
            response: {
                ...responseData,
                payload,
                id,
                responseData,
                formStatus: isSuccess ? 'success' : 'error',
                formValues: {
                    ...form.getFieldsValue(),
                },
                templateContext,
                parentSetState,
            },
        });
        if (isSuccess) {
            if (evaluateOnSuccess) {
                sendEventsAfterSuccess(evaluateOnSuccess, payload);
            }
        }
        // Unsubscribe for this event from Messagebus
        MessageBus.unsubscribe(subscriptionId);
    }
};

const collector = (workflowConfiguration) => (
    payload,
    [, setFormStatus],
    form
) => {
    const {
        datasource,
        datasourceExpr,
        workflow,
        initialize = true,
        submitEvent = 'SUBMIT',
        submitEventExpr,
        requestMapping,
        responseMapping,
        successStates = [],
        errorStates = [],
        submissionValidation,
        id,
        datasources,
        templateContext,
        parentSetState,
        queryData,
        evaluateOnSuccess,
        routeData,
    } = workflowConfiguration;

    MessageBus.subscribe(
        id.concat('.').concat(workflow),
        'WF.'.concat(workflow).concat('.STATE.CHANGE'),
        handleResponse(
            workflow,
            successStates,
            errorStates,
            form,
            submissionValidation,
            id,
            payload,
            templateContext,
            parentSetState,
            evaluateOnSuccess,
            routeData,
            datasources
        ),
        { form, formStatusSetter: setFormStatus }
    );
    if (initialize) {
        MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
            header: {
                registrationId: workflow,
                workflow,
                eventType: 'INIT',
            },
        });
    }

    const { data, params, decisionData, ...others } = payload;

    const request = {
        body: data,
        params,
        ...others,
    };

    if (payload.decisionData) {
        request.decisionData = payload.decisionData;
    }

    let event = submitEvent;

    if (submitEventExpr) {
        event = jsonata(submitEventExpr).evaluate(payload);
    }

    MessageBus.send('WF.'.concat(workflow).concat('.').concat(event), {
        header: {
            registrationId: workflow,
            workflow,
            eventType: event,
        },
        body: {
            datasource:
                datasources?.[
                    datasource ||
                        (datasourceExpr
                            ? jsonata(datasourceExpr).evaluate({
                                  data: queryData,
                                  payload: payload,
                                  routeData: location?.state?.routeData || {},
                              })
                            : '')
                ],
            request,
            requestMapping,
            responseMapping,
        },
    });

    cache.remove(id);
};

const template = (data, additionalParams = {}) => ({
    ReactTemplate: {
        component: ReactTemplate.component,
        metaConverter: (field) => ({
            ...field,
            widgetProps: {
                component: {
                    params: {
                        state: { ...additionalParams, ...field.state },
                        constants: field.constants,
                        isParentProvider: field.isParentProvider || false,
                        render: field.template,
                        import: field.import,
                        parseKey: field.parseKey || '%',
                    },
                },
                data: {
                    data,
                },
            },
        }),
    },
});

const convertUserExtensions = (userExtensions) => {
    const { extensions } = userExtensions;

    return [
        {
            ...(extensions.formPresets || {}),
            ...(extensions.fieldPresets || {}),
            widgets: extensions.widgetPresets,
        },
        {
            ...(extensions.parserPresets || {}),
            get,
        },
    ];
};

const getSecondaryDatasources = (secondaryDatasources, datasources = {}) => {
    return secondaryDatasources.reduce((acc, src) => {
        const datasource = datasources[src];
        if (datasource) {
            acc[src] = { ...datasource };
        }
        return acc;
    }, {});
};

const Form = (props) => {
    const {
        properties,
        plugin = {},
        parentProps,
        component: { id },
        delayedData = {},
        data: { data },
        parentSetState,
    } = props;

    const datasources = parentProps?.datasources || props?.datasources;

    const {
        invoke,
        extension,
        datasource,
        datasourceExpr,
        workflow,
        initialize = true,
        submitEvent = 'SUBMIT',
        submitEventExpr,
        responseMapping,
        requestMapping,
        successStates,
        errorStates,
        submissionValidation,
        contextTransform,
        requestContext = false,
        secondaryDatasources = [],
        microflows = {},
        title,
        breadcrumbs,
        dataAvailabilityWaitPeriod,
        dataKey,
        evaluateOnSuccess = null,
    } = properties;

    const { context: templateContext, dispatch } = useTemplateContext();
    const location = useLocation();
    const history = useHistory();

    const [userExtensions, isLoading] = usePlugins(plugin, invoke, extension);
    const [status, setStatus] = useState();
    const [loading, setLoading] = useState(false);

    const getSchema = useCallback(
        collector({
            datasources,
            datasource,
            datasourceExpr,
            workflow,
            requestMapping,
            responseMapping,
            successStates,
            errorStates,
            initialize,
            submitEvent,
            submitEventExpr,
            submissionValidation,
            id,
            queryData: data,
            templateContext,
            parentSetState,
            evaluateOnSuccess,
            routeData: location?.state?.routeData,
        }),
        []
    );

    const [extensionPresets, extensionOptions] = convertUserExtensions(
        userExtensions
    );
    const presets = React.useMemo(
        () => ({
            ...extensionPresets,
            widgets: {
                ...extensionPresets.widgets,
                ...template(data, { delayedData }),
            },
            functions: {
                sendEvent: (event, data, isWorkflow = true) => {
                    isWorkflow
                        ? sendWorkflowEvent(workflow, event, data)
                        : MessageBus.send(event, data);
                },
                saveForm: (form) => cache.put(id, form.getFieldsValue(true)),
                invokeMicroflow: (flowId, form) =>
                    invokeMicroflow(
                        flowId,
                        id,
                        microflows[flowId],
                        options,
                        form,
                        datasources,
                        setStatus
                    ),
                cleanupCache: (ids) => cache.removeAll(ids),
                setStatus: (status) => setStatus(status),
                routeTo: (route, data) =>
                    history.push(route, { routeData: data }),
            },
        }),
        [extensionPresets]
    );

    useEffect(() => {
        if (
            dataKey &&
            data[dataKey] &&
            Object.keys(data[dataKey])?.length === 0 &&
            !location?.state?.routeData?.inviteToken
        ) {
            setLoading(true);
            const timer = setTimeout(() => {
                setLoading(false);
            }, dataAvailabilityWaitPeriod);

            return () => clearTimeout(timer);
        }
    }, [dataAvailabilityWaitPeriod, data]);

    const options = {
        // put variables here, like CTN, etc
        ...extensionOptions,
        data,
        cache: cache.getAll(), // optimze to take keys that are needed
        templateContext,
        dispatch,
        routeData: location?.state?.routeData || {},
        routeContext: { src: location?.state?.src },
        delayedData,
        datasources: getSecondaryDatasources(secondaryDatasources, datasources),
        context: requestContext
            ? getContextData(
                  workflow,
                  'WF.'.concat(workflow).concat('.STATE.REQUEST'),
                  contextTransform
              )
            : {},
    };

    if (isLoading || loading) {
        return <Spin tip="Loading" />;
    }

    return (
        <>
            {!dataAvailabilityWaitPeriod ||
            (dataKey && data[dataKey] && Object.keys(data[dataKey])?.length) ||
            location?.state?.routeData?.inviteToken ? (
                <>
                    {breadcrumbs && title && (
                        <BreadCrumb title={title} breadcrumbs={breadcrumbs} />
                    )}
                    <FormBuilder
                        presets={presets}
                        options={options}
                        config={properties}
                        getSchema={getSchema}
                        initialValues={cache.get(id)}
                        status={status}
                        setStatus={setStatus}
                    />
                </>
            ) : (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                    Error getting data!
                </div>
            )}
        </>
    );
};

export default Form;
