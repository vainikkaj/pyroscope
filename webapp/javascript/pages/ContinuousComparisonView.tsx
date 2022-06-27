import React, { useEffect } from 'react';
import 'react-dom';

import Box from '@webapp/ui/Box';
import { FlamegraphRenderer } from '@pyroscope/flamegraph';
import { useAppDispatch, useAppSelector } from '@webapp/redux/hooks';
import {
  selectContinuousState,
  actions,
  selectComparisonState,
  fetchComparisonSide,
  fetchTagValues,
  selectQueries,
} from '@webapp/redux/reducers/continuous';
import TimelineChartWrapper from '@webapp/components/TimelineChartWrapper';
import Toolbar from '@webapp/components/Toolbar';
import InstructionText from '@webapp/components/InstructionText';
import ExportData from '@webapp/components/ExportData';
import useExportToFlamegraphDotCom from '@webapp/components/exportToFlamegraphDotCom.hook';
import TagsBar from '@webapp/components/TagsBar';
import useTimeZone from '@webapp/hooks/timeZone.hook';
import useColorMode from '@webapp/hooks/colorMode.hook';
import styles from './ContinuousComparison.module.css';
import useTags from '../hooks/tags.hook';
import useTimelines, { leftColor, rightColor } from '../hooks/timeline.hook';
import usePopulateLeftRightQuery from '../hooks/populateLeftRightQuery.hook';
import useFlamegraphSharedQuery from '../hooks/flamegraphSharedQuery.hook';

function ComparisonApp() {
  const dispatch = useAppDispatch();
  const { leftFrom, rightFrom, leftUntil, rightUntil } = useAppSelector(
    selectContinuousState
  );
  const { leftQuery, rightQuery } = useAppSelector(selectQueries);
  const { offset } = useTimeZone();
  const { colorMode } = useColorMode();
  usePopulateLeftRightQuery();
  const comparisonView = useAppSelector(selectComparisonState);
  const { leftTags, rightTags } = useTags({ leftQuery, rightQuery });
  const { leftTimeline, rightTimeline } = useTimelines();
  const sharedQuery = useFlamegraphSharedQuery();

  useEffect(() => {
    const fetchLeftQueryData = leftQuery
      ? dispatch(fetchComparisonSide({ side: 'left', query: leftQuery }))
      : null;

    return () => {
      if (fetchLeftQueryData && fetchLeftQueryData.abort) {
        fetchLeftQueryData.abort();
      }
    };
  }, [leftFrom, leftUntil, leftQuery]);

  useEffect(() => {
    const fetchRightQueryData = rightQuery
      ? dispatch(fetchComparisonSide({ side: 'right', query: rightQuery }))
      : null;

    return () => {
      if (fetchRightQueryData && fetchRightQueryData.abort) {
        fetchRightQueryData.abort();
      }
    };
  }, [rightFrom, rightUntil, rightQuery]);

  const leftSide = comparisonView.left.profile;
  const rightSide = comparisonView.right.profile;
  const exportToFlamegraphDotComLeftFn = useExportToFlamegraphDotCom(leftSide);
  const exportToFlamegraphDotComRightFn =
    useExportToFlamegraphDotCom(rightSide);
  const timezone = offset === 0 ? 'utc' : 'browser';

  return (
    <div>
      <div className="main-wrapper">
        <Toolbar
          hideTagsBar
          onSelectedName={(query) => {
            dispatch(actions.setRightQuery(query));
            dispatch(actions.setLeftQuery(query));
            dispatch(actions.setQuery(query));
          }}
        />
        <Box>
          <TimelineChartWrapper
            data-testid="timeline-main"
            id="timeline-chart-double"
            format="lines"
            height="125px"
            timelineA={leftTimeline}
            timelineB={rightTimeline}
            onSelect={(from, until) => {
              dispatch(actions.setFromAndUntil({ from, until }));
            }}
            markings={{
              left: { from: leftFrom, to: leftUntil, color: leftColor },
              right: { from: rightFrom, to: rightUntil, color: rightColor },
            }}
            timezone={timezone}
          />
        </Box>
        <div
          className="comparison-container"
          data-testid="comparison-container"
        >
          <Box className={styles.comparisonPane}>
            <TagsBar
              query={leftQuery}
              tags={leftTags}
              onSetQuery={(q) => {
                dispatch(actions.setLeftQuery(q));
              }}
              onSelectedLabel={(label, query) => {
                dispatch(fetchTagValues({ query, label }));
              }}
            />
            <FlamegraphRenderer
              panesOrientation="vertical"
              profile={leftSide}
              data-testid="flamegraph-renderer-left"
              colorMode={colorMode}
              sharedQuery={{ ...sharedQuery, id: 'left' }}
              ExportData={
                // Don't export PNG since the exportPng code is broken
                leftSide && (
                  <ExportData
                    flamebearer={leftSide}
                    exportJSON
                    exportHTML
                    exportPprof
                    exportFlamegraphDotCom
                    exportFlamegraphDotComFn={exportToFlamegraphDotComLeftFn}
                  />
                )
              }
            >
              <InstructionText viewType="double" viewSide="left" />
              <TimelineChartWrapper
                key="timeline-chart-left"
                id="timeline-chart-left"
                data-testid="timeline-left"
                timelineA={leftTimeline}
                markings={{
                  left: { from: leftFrom, to: leftUntil, color: leftColor },
                }}
                onSelect={(from, until) => {
                  dispatch(actions.setLeft({ from, until }));
                }}
                timezone={timezone}
              />
            </FlamegraphRenderer>
          </Box>

          <Box className={styles.comparisonPane}>
            <TagsBar
              query={rightQuery}
              tags={rightTags}
              onSetQuery={(q) => {
                dispatch(actions.setRightQuery(q));
              }}
              onSelectedLabel={(label, query) => {
                dispatch(fetchTagValues({ query, label }));
              }}
            />
            <FlamegraphRenderer
              profile={rightSide}
              data-testid="flamegraph-renderer-right"
              panesOrientation="vertical"
              colorMode={colorMode}
              sharedQuery={{ ...sharedQuery, id: 'right' }}
              ExportData={
                // Don't export PNG since the exportPng code is broken
                rightSide && (
                  <ExportData
                    flamebearer={rightSide}
                    exportJSON
                    exportHTML
                    exportPprof
                    exportFlamegraphDotCom
                    exportFlamegraphDotComFn={exportToFlamegraphDotComRightFn}
                  />
                )
              }
            >
              <InstructionText viewType="double" viewSide="right" />
              <TimelineChartWrapper
                key="timeline-chart-right"
                id="timeline-chart-right"
                data-testid="timeline-right"
                timelineA={rightTimeline}
                markings={{
                  right: { from: rightFrom, to: rightUntil, color: rightColor },
                }}
                onSelect={(from, until) => {
                  dispatch(actions.setRight({ from, until }));
                }}
                timezone={timezone}
              />
            </FlamegraphRenderer>
          </Box>
        </div>
      </div>
    </div>
  );
}

export default ComparisonApp;