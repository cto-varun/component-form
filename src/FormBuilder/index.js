import { Form, Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import AntdFormBuilder from './AntdFormBuilder';
import useConfiguration from './hooks/useConfiguration';
import useForceUpdate from './hooks/useForceUpdate';
import { getStatusResponse, getStatus } from './utils/helpers';

const onFinish = ({
    getSchema,
    getSchemaCallback,
    options,
    status,
    setStatus,
    form,
}) => (values) => {
    const schema = getSchema({ options, ...values });
    setStatus('pending');
    getSchemaCallback(schema, [status, setStatus], form);
};

const MetaFormBuilder = ({ form, meta: metaArray }) => {
    return metaArray.map((meta, index) => {
        if (meta.fieldsetTitle) {
            return (
                <fieldset
                    key={index}
                    className={`fb__fieldset-title-${meta.fieldsetTitle}`}
                >
                    <legend>{meta.fieldsetTitle}</legend>
                    <AntdFormBuilder form={form} meta={meta} />
                </fieldset>
            );
        }

        return <AntdFormBuilder key={index} meta={meta} />;
    });
};

const FormBuilder = ({
    config,
    options,
    presets,
    getSchema: getSchemaCallback,
    initialValues,
    status,
    setStatus,
}) => {
    const [form] = Form.useForm();
    const forceUpdate = useForceUpdate();
    const {
        applyOptions,
        isReadyToConsume,
        getSchema,
        onStatusChange,
        onValuesChange,
        getWidgets,
        formProps,
    } = useConfiguration(config, presets);
    const [cachedOptions, setCachedOptions] = useState({
        ...options,
        form,
        forceUpdate,
        status,
        setStatus,
    });
    const [cachedMeta, setCachedMeta] = useState();
    const fieldsValue = useRef();

    useEffect(
        function onOptionsChange() {
            setCachedOptions((o) => ({ ...o, ...options, status }));
            forceUpdate();
        },
        [options]
    );

    useEffect(
        function applyOptionsEffect() {
            const updatedMeta = applyOptions && applyOptions(cachedOptions);
            if (updatedMeta) {
                const { meta } = updatedMeta;
                setCachedMeta(meta);
            }
            forceUpdate();
        },
        [applyOptions, cachedOptions]
    );

    useEffect(
        function statusChangeEffect() {
            if (status != null) {
                if (getStatus(status, 'reset')) {
                    form.resetFields();
                    setStatus();
                    forceUpdate();
                    return;
                }

                const [formStatus, props] = getStatusResponse(status);
                const meta =
                    onStatusChange &&
                    onStatusChange(formStatus, {
                        ...cachedOptions,
                        ...props,
                    });
                if (meta) {
                    setCachedMeta(meta);
                    forceUpdate();
                }
            }
        },
        [onStatusChange, status]
    );

    useEffect(
        function defineWidgets() {
            if (isReadyToConsume) {
                getWidgets(AntdFormBuilder);
            }
        },
        [isReadyToConsume]
    );

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
            forceUpdate();
        }
    }, []);

    return cachedMeta ? (
        <Form
            {...formProps}
            form={form}
            onFinish={onFinish({
                getSchema,
                getSchemaCallback,
                options: cachedOptions,
                status,
                setStatus,
                form,
            })}
            onValuesChange={(_, values) => {
                fieldsValue.current = values;
                const meta = onValuesChange({
                    ...values,
                    options: cachedOptions,
                });
                if (meta) {
                    setCachedMeta(meta);
                }
                forceUpdate();
            }}
        >
            <MetaFormBuilder form={form} meta={cachedMeta} />
        </Form>
    ) : (
        <div className="fb__form--loading">
            <Spin tip="Loading..." />
        </div>
    );
};

export default FormBuilder;
