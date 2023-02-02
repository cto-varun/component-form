/* eslint react/no-multi-comp: 0 */
import React from 'react';
import find from 'lodash/find';
import { Col, Row } from 'antd';
import FormBuilderField from './FormBuilderField';
import './FormBuilder.css';
import { assert } from '../utils/helpers';

const widgetMap = {};

function getWidget(widget) {
    if (!widget) return null;
    if (typeof widget === 'string') {
        if (!widgetMap[widget] || !widgetMap[widget].widget) {
            return null;
        }
        return widgetMap[widget].widget;
    }
    return widget;
}

function normalizeMeta(meta) {
    let fields = assert(meta, 'array') ? meta : meta.fields || meta.elements;
    if (!fields) fields = [meta];
    fields = fields.map((field) => {
        const widget = getWidget(field.widget);
        const viewWidget = getWidget(field.viewWidget);
        const dynamic = field.dynamic !== false;
        // Find metaConvertor
        const item = find(
            Object.values(widgetMap),
            (entry) =>
                (entry.widget === widget || entry.widget === viewWidget) &&
                entry.metaConvertor
        );
        if (item) {
            const newField = item.metaConvertor(field);
            if (!newField) {
                throw new Error(
                    `metaConvertor of '${String(
                        field.widget
                    )}' must return a field`
                );
            }
            return { ...newField, viewWidget, widget, dynamic };
        }
        return { ...field, widget, viewWidget, dynamic };
    });
    if (assert(meta, 'array') || (!meta.fields && !meta.elements)) {
        return { fields };
    }
    return {
        ...meta,
        fields,
    };
}

function FormBuilder(props) {
    const { getMeta, form } = props;
    console.log(props, "these are form builder")
    const meta = getMeta ? getMeta(form, props) : props.meta;
    return (
        <FormBuilderInner
            {...props}
            form={form ? form.current || form : null}
            meta={meta}
        />
    );
}

function FormBuilderInner(props) {
    const {
        meta,
        viewMode,
        initialValues,
        disabled = false,
        form = null,
    } = props;
    if (!meta) return null;

    const newMeta = normalizeMeta(meta);
    newMeta.viewMode = newMeta.viewMode || viewMode;
    newMeta.initialValues = newMeta.initialValues || initialValues;

    const { fields, columns = 1, gutter = 10 } = newMeta;
    const elements = fields.map((field) => (
        <FormBuilderField
            key={field.key}
            field={field}
            disabled={disabled}
            meta={newMeta}
            form={form}
        />
    ));
    if (columns === 1) {
        return elements;
    }

    const rows = [];
    // for each column , how many grid cols
    const spanUnit = 24 / columns;
    // eslint-disable-next-line
    for (let i = 0; i < elements.length; ) {
        const cols = [];
        for (
            let j = 0;
            (j < columns || j === 0) && // total col span is less than columns
            i < elements.length && // element exist
            (!['left', 'both'].includes(fields[i].clear) || j === 0); // field doesn't need to start a new row

        ) {
            const fieldSpan = fields[i].colSpan || 1;
            cols.push(
                elements[i]?.props?.field?.hidden ? (
                    <></>
                ) : (
                    <Col key={j} span={Math.min(24, spanUnit * fieldSpan)}>
                        {elements[i]}
                    </Col>
                )
            );
            j += fieldSpan;
            if (['both', 'right'].includes(fields[i].clear)) {
                i += 1;
                break;
            }
            i += 1;
        }
        rows.push(
            <Row key={i} gutter={gutter}>
                {cols}
            </Row>
        );
    }
    return rows;
}

FormBuilder.defineWidget = (name, widget, metaConvertor = null) => {
    if (!widgetMap[name]) {
        widgetMap[name] = {
            widget,
            metaConvertor,
        };
    }
};

FormBuilder.useForceUpdate = () => {
    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState({}), []);
    return forceUpdate;
};

export default FormBuilder;
