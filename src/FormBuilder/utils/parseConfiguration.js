import merge from 'lodash/merge';
import omit from 'lodash/omit';
import initializeParserTokens from './parserTokens';
import {
    assert,
    parseData,
    normalizeArray,
    normalizeObject,
    getWidgetPath,
    getWidgetPaths,
    applyFieldToMetaConverter,
    zipWidget,
} from './helpers';
import initializeParseEntity from './parseEntity';

/** **************************
 * META NORMALIZATION HELPERS
 *
 */

const normalizeUpdateFields = (key, updatesArray) => {
    return updatesArray.map((updateObject) => {
        if (!updateObject) return updateObject;
        return {
            ...updateObject,
            key,
        };
    });
};

const normalizeUpdateObject = (key, update) => {
    const empty = [null, null];
    if (assert(update, 'object')) {
        return normalizeUpdateFields(key, [update, null]);
    }

    if (assert(update, 'array')) {
        return normalizeUpdateFields(
            key,
            empty.map((pos, index) => {
                if (update[index]) return update[index];
                return pos;
            })
        );
    }

    return empty;
};

const normalizeUpdate = (update) => {
    if (!assert(update, 'object')) return [];
    return Object.keys(update).reduce(
        (acc, key) => {
            const updateObject = update[key];
            const [updateOnTrue, updateOnFalse] = normalizeUpdateObject(
                key,
                updateObject
            );

            return [
                [...acc[0], updateOnTrue].filter((i) => i),
                [...acc[1], updateOnFalse].filter((i) => i),
            ];
        },
        [[], []]
    );
};

const handlePreset = (presets, parseEntity, { PARSE_KEY }) => (
    value,
    consume = true
) => {
    debugger;
    if (assert(value, 'string')) {
        const preset = value;
        if (preset.startsWith(PARSE_KEY)) {
            return consume ? parseEntity(preset)(presets) : parseEntity(preset);
        }
    }
    if (assert(value?.preset, 'string')) {
        const { preset } = value;
        if (preset.startsWith(PARSE_KEY)) {
            return consume ? parseEntity(preset)(presets) : parseEntity(preset);
        }
    }

    return value;
};
const fieldIsObject = (item) => assert(item, 'object');
const fieldHasKey = (item) => assert(item, 'key', true);
const combineClassNames = (baseClassName, userClassName = '') =>
    `${baseClassName}${userClassName ? ` ${userClassName}` : ''}`;
const normalizeFieldKeys = (prefixFieldKey = '') => (field) => {
    const widgetName = field.widget || 'input';
    const prefix = prefixFieldKey.length ? `${prefixFieldKey}_` : '';
    const newKey = `${prefix}${field.key}`;
    return merge(field, {
        key: newKey,
        formItemProps: {
            className: combineClassNames(
                `fb__form-item-element form-item-element--${newKey}`,
                field.formItemProps?.className
            ),
        },
        widgetProps: {
            className: combineClassNames(
                `fb__widget-element fb__widget-element--${widgetName} widget-element--${newKey}`,
                field.widgetProps?.className
            ),
        },
    });
};
const normalizeFields = (prefixFieldKey, getPreset, presets) => (meta) => {
    const gp = (value) => getPreset(value, false);
    return {
        ...meta,
        fields: normalizeArray(getPreset(meta.fields))
            .map((field) => {
                let fieldPresets = parseData(gp)(field);
                if (typeof fieldPresets === 'function') {
                    fieldPresets = fieldPresets(presets);
                }

                if (typeof fieldPresets?.preset === 'function') {
                    fieldPresets.preset = fieldPresets.preset(presets);
                }
                if (fieldPresets?.preset) {
                    return omit(
                        {
                            ...fieldPresets.preset,
                            ...fieldPresets,
                        },
                        ['preset']
                    );
                }
                return fieldPresets;
            })
            .filter((field) => fieldIsObject(field) && fieldHasKey(field))
            .map(normalizeFieldKeys(prefixFieldKey)),
    };
};
/**
 * END META NORMALIZATION HELPERS
 ********************************
 */

/**
 *
 * @param {*} config
 * @param {*} param1
 * @param {*} parseEntity
 * @param {*} presets
 */
const getMeta = (config, parseEntity, getPreset, presets) => {
    const meta = normalizeArray(getPreset(config.meta));
    // Normalize presets and field presets
    const presetNormalizedMeta = meta
        .map(getPreset)
        .filter(fieldIsObject)
        .map(normalizeFields(config.prefixFieldKey, getPreset, presets));

    return presetNormalizedMeta.map((normalizedMeta) =>
        parseData(parseEntity)(normalizedMeta)
    );
};

/**
 * sideEffects: {
 *    when: "@@() => 2 + 2",
 *    update: []
 * }
 * @param {*} config
 * @param {*} parserTokens
 * @param {*} parseEntity
 * @param {*} presets
 */
const getSideEffects = (config, parseEntity, getPreset) => {
    const normalizedSideEffects = normalizeArray(getPreset(config.sideEffects));
    const getValue = parseData(parseEntity);
    return normalizedSideEffects.reduce((acc, sideEffect) => {
        const normalizedEffect = normalizeObject(getPreset(sideEffect), [
            'when',
            'update',
        ]);
        const when = getValue(normalizedEffect.when);
        const update = getValue(
            normalizeUpdate(getPreset(normalizedEffect.update))
        );
        if (update.length && assert(when, 'function')) {
            return [
                ...acc,
                {
                    when,
                    update,
                },
            ];
        }
        return acc;
    }, []);
};

const getStatus = (config, parseEntity, getPreset) => {
    const getValues = parseData(parseEntity);
    const normalizedStatusConfig = normalizeObject(getPreset(config.status));
    return Object.keys(normalizedStatusConfig).reduce((acc, status) => {
        const statusUpdates = normalizeObject(
            getPreset(normalizedStatusConfig[status])
        );
        const statusUpdateKeys = Object.keys(statusUpdates);

        const normalizedStatus = statusUpdateKeys
            .map((key) => {
                const normalizedUpdate = normalizeObject(
                    getPreset(statusUpdates[key])
                );
                if (Object.keys(normalizedUpdate).length) {
                    return {
                        ...normalizedUpdate,
                        key,
                    };
                }
                return null;
            })
            .filter((i) => i);

        const update = getValues(normalizedStatus);
        if (update.length) {
            return {
                ...acc,
                [status]: update,
            };
        }

        return acc;
    }, {});
};

const getSchema = (config, parseEntity) => {
    const parser = (v) => parseEntity(v, { noPresets: true });
    const getValue = parseData(parser);
    const normalizedSchema = normalizeObject(config.schema);
    return getValue(normalizedSchema);
};

const getWidgets = (meta, presets, parseEntity) => {
    const getValue = parseData(parseEntity);
    const normalizedWidgets = normalizeObject(
        normalizeObject(presets, ['widgets']).widgets
    );

    const widgetList = Object.keys(normalizedWidgets);
    const widgetPaths = [];
    const widgetFields = [];
    const widgetMap = widgetList.reduce((acc, widgetName) => {
        const widget = normalizeObject(normalizedWidgets[widgetName], [
            'component',
            'metaConverter',
        ]);
        //const pathToWidget = getWidgetPath(meta, widgetName);
        const pathToWidgets = getWidgetPaths(meta, widgetName);

        if (
            pathToWidgets &&
            pathToWidgets.length > 0 &&
            assert(widget.component, 'function') &&
            assert(widget.metaConverter, 'function')
        ) {
            pathToWidgets.forEach((path) => {
                const newField = getValue(
                    applyFieldToMetaConverter(meta, path, widget.metaConverter)
                );

                widgetFields.push(newField);
                widgetPaths.push(path);
            });

            return [
                ...acc,
                {
                    widget: widgetName,
                    component: widget.component,
                },
            ];
        }

        return acc;
    }, []);

    const updatedMeta = zipWidget(meta, widgetPaths, widgetFields);
    return {
        widgets: (instance) => {
            widgetMap.forEach(({ widget, component }) => {
                instance.defineWidget(widget, component);
            });
        },
        updatedMeta,
    };
};

const parseConfiguration = (config = {}, presets = {}) => {
    const parserTokens = initializeParserTokens(config);
    const parseEntity = initializeParseEntity(parserTokens, presets);
    const getPreset = handlePreset(presets, parseEntity, parserTokens);

    const meta = getMeta(config, parseEntity, getPreset);
    const schema = getSchema(config, parseEntity);
    const sideEffects = getSideEffects(config, parseEntity, getPreset);
    const status = getStatus(config, parseEntity, getPreset);
    const { widgets, updatedMeta } = getWidgets(meta, presets, parseEntity);

    let verticalLayout = {};
    updatedMeta.forEach((singleMeta) => {
        if (!singleMeta.formItemLayout) {
            singleMeta.formItemLayout = null;
            verticalLayout = { layout: 'vertical' };
        }
    });

    return {
        meta: updatedMeta,
        schema,
        sideEffects,
        status,
        widgets,
        verticalLayout,
    };
};

export default parseConfiguration;
