import { useEffect, useRef, useState } from 'react';
import parseConfiguration from '../utils/parseConfiguration';
import {
  consumeFunctions,
  consumeSchema,
  consumeSideEffects,
  consumeStatusUpdates,
} from '../utils/helpers';

const useConfiguration = (config = {}, presets = {}) => {
  const [isReadyToConsume, setIsReadyToConsume] = useState(false);
  const applyOptions = useRef();
  const getSchema = useRef();
  const onValuesChange = useRef();
  const onStatusChange = useRef();
  const getWidgets = useRef();
  const formProps = useRef();
  useEffect(() => {
    if (!applyOptions.current) {
      const {
        meta,
        schema,
        sideEffects,
        status,
        widgets,
        verticalLayout,
      } = parseConfiguration(config, presets);

      applyOptions.current = consumeFunctions({ meta });
      onValuesChange.current = consumeSideEffects({ meta, sideEffects });
      onStatusChange.current = consumeStatusUpdates({ meta, status });
      getSchema.current = consumeSchema({ schema });
      getWidgets.current = widgets;
      formProps.current = {
        ...verticalLayout,
        ...(config.formProps || {}),
      };
      setIsReadyToConsume(true);
    }
  }, []);

  return {
    applyOptions: applyOptions.current,
    getSchema: getSchema.current,
    getWidgets: getWidgets.current,
    onValuesChange: onValuesChange.current,
    onStatusChange: onStatusChange.current,
    isReadyToConsume,
    formProps: formProps.current,
  };
};

export default useConfiguration;
