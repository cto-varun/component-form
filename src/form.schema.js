export const schema = {
    title: 'Chart settings',
    type: 'object',
    properties: {
        // GENERAL
        general: {
            title: 'General settings',
            type: 'object',
            properties: {
                minHeight: {
                    title: 'Minimal height of chart. 0 to disable',
                    type: 'number',
                    default: 512,
                },
                maxHeight: {
                    title: 'Maximal height of chart. 0 to disable',
                    type: 'number',
                    default: 1024,
                },
                height: {
                    title: 'Height of chart. 0 to use parent height',
                    type: 'number',
                    default: 0,
                },

                animate: {
                    title: 'Chart animation switch',
                    type: 'boolean',
                    default: true,
                },
                scale: {
                    title: "The scale info of chart's source data",
                    type: 'object',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            type: {
                                title: 'Scaling type of chart',
                                type: 'string',
                                enum: [
                                    'identity',
                                    'linear',
                                    'cat',
                                    'time',
                                    'timeCat',
                                    'log',
                                    'pow',
                                ],
                            },
                            alias: {
                                title:
                                    'Field name, that is displayed in legend, tooltip and axis',
                                type: 'string',
                            },
                            range: {
                                title: 'The minimum and maximum values on axis',
                                type: 'object',
                                min: {
                                    type: 'number',
                                },
                                max: {
                                    type: 'number',
                                },
                            },
                            tickCount: {
                                title: 'Count of ticks',
                                type: 'number',
                            },
                            ticks: {
                                title: 'List of ticks',
                                type: 'array',
                                items: {
                                    type: 'number',
                                },
                            },
                        },
                    },
                },
            },
        },

        // COORD
        coord: {
            title: 'Coordinates settings',
            type: 'object',
            properties: {
                type: {
                    title: 'Coordinate axis type',
                    type: 'string',
                    enum: ['theta', 'polar', 'hexlix', 'gauge', 'clock'],
                },
                radius: {
                    title: 'Outer radius',
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                },
                innerRadius: {
                    title: 'Inner radius',
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                },
            },
        },

        // STACK
        stack: {
            title: 'Stacking different data fields',
            type: 'object',
            properties: {
                enabled: {
                    title: 'Will chart be stacked',
                    type: 'boolean',
                    default: false,
                },
                type: {
                    title: 'Stacking type',
                    type: 'string',
                    enum: [
                        'fill-rows',
                        'impute',
                        'fold',
                        'percent',
                        'bin.histogram',
                        'bin.hexagon',
                        'bin.rectangle',
                    ],
                },
                fields: {
                    title: 'Stack these fields',
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
                key: {
                    title: 'Key of transformed data',
                    type: 'string',
                },
                field: {
                    title: 'Field to stack (instead of `fields`)',
                    type: 'string',
                },
                value: {
                    title: 'Value of transformed data',
                    type: 'string',
                },
                dimension: {
                    title: 'Dimension of stacking',
                    type: 'string',
                },
                bins: {
                    title: 'List of bins',
                    type: 'array',
                    items: {
                        type: 'number',
                    },
                },
                binWidth: {
                    title: 'Bin width [from, to]',
                    type: 'array',
                    maxItems: 2,
                    items: {
                        type: 'number',
                    },
                },
                as: {
                    title: 'Transform as',
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
            },
        },

        // GEOMETRY
        geometry: {
            title: 'Geometry settings',
            type: 'object',
            required: ['types', 'positions'],
            properties: {
                types: {
                    title: 'Geometry types',
                    type: 'array',
                    minItems: 1,
                    items: {
                        type: 'string',
                        enum: [
                            'point',
                            'line',
                            'area',
                            'interval',
                            'polygon',
                            'edge',
                            'schema',
                            'contour',
                            'heatmap',
                            'intervalStack',
                        ],
                    },
                    default: ['point', 'line'], // TODO remove
                },
                positions: {
                    title: 'Fields for [X,Y] axis',
                    type: 'array',
                    minItems: 2,
                    maxItems: 2,
                    uniqueItems: true,
                    items: {
                        type: 'string',
                    },
                    default: ['version', 'ram'], // TODO remove
                },
                color: {
                    title: 'Colors of components',
                    type: ['string', 'array'],
                    items: {
                        type: 'string',
                    },
                    example: [
                        'location',
                        ['#ffd54f', '#ef6c00', '#1976d2', '#64b5f6'],
                    ],
                },
                shape: {
                    title:
                        'Method of mapping data values to the shape of a graphic',
                    type: ['string', 'array'],
                },
                opacity: {
                    title: 'Transparency of data values',
                    type: ['number', 'function'],
                    default: 0.6,
                },
                style: {
                    title: 'Style of shape',
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
                adjust: {
                    title: 'Adjust type of graphical marks',
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
                size: {
                    title: 'Size',
                    type: 'number',
                },
                tooltip: {
                    title: 'X*Y keys for tooltip content',
                    type: 'string',
                },
            },
        },

        // TOOLTIP
        tooltip: {
            title: 'Info that shows on hover at point',
            type: 'object',
            properties: {
                enabled: {
                    title: 'Does tooltip should be displayed',
                    type: 'boolean',
                    default: true,
                },
                title: {
                    title: 'Custom title text',
                    type: 'string',
                },
                crosshairs: {
                    title: 'Crosshair',
                    type: 'object',
                    properties: {
                        type: {
                            title: 'Type',
                            type: 'string',
                        },
                    },
                },
                containerTpl: {
                    title: 'Container template',
                    type: 'string',
                },
                itemTpl: {
                    title: 'Item template',
                    type: 'string',
                },
                position: {
                    title: 'Position on screen',
                    type: 'string',
                    enum: ['null', 'top', 'bottom', 'left', 'right'],
                },
                showTitle: {
                    title: 'Display title',
                    type: 'boolean',
                },
            },
        },

        // LABEL
        label: {
            title: 'Label settings',
            type: 'object',
            properties: {
                enabled: {
                    title: 'Enable label',
                    type: 'boolean',
                    default: true,
                },
                content: {
                    title:
                        'Specify the text content displayed on the label, either the data latitude or custom',
                    type: 'string',
                },
            },
        },

        // LEGEND
        legend: {
            title: 'Legend settings',
            type: 'object',
            properties: {
                enabled: {
                    title: 'Enable legend',
                    type: 'boolean',
                    default: true,
                },
                name: {
                    title: 'Match key in data source',
                    type: 'string',
                },
                position: {
                    title: 'Where legend will be displayed relative to chart',
                    type: 'string',
                    enum: ['top', 'left', 'right', 'bottom'],
                },
                offset: {
                    title: 'Offset distance of legend in X and Y axis',
                    type: 'object',
                    properties: {
                        offsetX: {
                            title: 'X offset',
                            type: 'number',
                            default: 0,
                        },
                        offsetY: {
                            title: 'Y offest',
                            type: 'number',
                            default: 0,
                        },
                    },
                },
                title: {
                    title: 'Will title be displayed',
                    type: 'boolean',
                    default: true,
                },
                marker: {
                    title: 'Marker style type for legend',
                    type: 'string',
                    enum: [
                        'circle',
                        'square',
                        'bowtie',
                        'diamond',
                        'hexagon',
                        'triangle',
                        'triangle-down',
                        'hollowCircle',
                        'hollowSquare',
                        'hollowBowtie',
                        'hollowDiamond',
                        'hollowHexagon',
                        'hollowTriangle',
                        'hollowTriangle-down',
                        'cross',
                        'tick',
                        'plus',
                        'hyphen',
                        'line',
                    ],
                },
                clickable: {
                    title: 'Is legend clickable',
                    type: 'boolean',
                    default: true,
                },
                hoverable: {
                    title: 'Is legend hoverable',
                    type: 'boolean',
                    default: true,
                },
            },
        },

        // AXIS
        axis: {
            title: 'Axis settings',
            type: 'object',
            properties: {
                positions: {
                    title: 'The position of axes',
                    type: 'array',
                    minItems: 2,
                    maxItems: 2,
                    items: {
                        type: 'string',
                        enum: ['top', 'bottom', 'left', 'right'],
                    },
                    default: ['bottom', 'left'],
                },
                enabled: {
                    title: 'Enable vertical and horizontal axis',
                    type: 'array',
                    minItems: 2,
                    maxItems: 2,
                    items: {
                        type: 'boolean',
                    },
                    default: [true, true],
                },
                title: {
                    title: 'Title settings',
                    type: 'object',
                    properties: {
                        enabled: {
                            title: 'Enabled title',
                            type: 'boolean',
                            default: false,
                        },
                        autoRotate: {
                            title: 'Auto rotating',
                            type: 'boolean',
                            default: true,
                        },
                        offset: {
                            title: 'Offset',
                            type: 'number',
                            default: 50,
                        },
                        position: {
                            title: 'Position',
                            type: 'string',
                            enum: ['center', 'start', 'end'],
                        },
                    },
                },
                grid: {
                    title: 'Style of Grid',
                    type: 'object',
                    properties: {
                        enabled: {
                            title: 'Enable X,Y grid',
                            type: 'array',
                            minItems: 2,
                            maxItems: 2,
                            items: {
                                type: 'boolean',
                            },
                            default: [true, true],
                        },
                        type: {
                            title: 'Type',
                            type: 'string',
                            enum: ['line', 'polygon'],
                            default: 'line',
                        },
                        align: {
                            title: 'Align type',
                            type: 'string',
                            enum: ['center', 'end', 'left', 'right', 'start'],
                        },
                        showFirstLine: {
                            title: 'Show first line',
                            type: 'boolean',
                        },
                        alternateColor: {
                            title: 'Alternative color',
                            type: 'string',
                        },
                    },
                },
                subTickCount: {
                    title: 'The count of sub tick in axis',
                    type: 'number',
                },
            },
        },
    },
};

export const ui = {
    general: {
        'ui:tab': {
            key: 'general',
            label: 'General',
        },
    },
    coord: {
        'ui:tab': {
            key: 'general',
            label: 'General',
        },
    },
    stack: {
        'ui:tab': {
            // Can be assigned as `ui:tab: 'general'`. It's value will work as key and as label at the same time
            key: 'stack',
            label: 'Stack',
        },
    },
    geometry: {
        'ui:tab': {
            key: 'geometry',
            label: 'Geometry',
        },
        color: {
            'ui:widget': 'color',
        },
    },
    tooltip: {
        'ui:tab': {
            key: 'tooltip',
            label: 'Tooltip',
        },
    },
    label: {
        'ui:tab': {
            key: 'label',
            label: 'Label',
        },
    },
    legend: {
        'ui:tab': {
            key: 'legend',
            label: 'Legend',
        },
    },
    axis: {
        'ui:tab': {
            key: 'axis',
            label: 'Axis',
        },
        grid: {
            alternateColor: {
                'ui:widget': 'color',
            },
        },
    },
};
