import { Divider, Layout, Row, Steps, Typography } from 'antd';
import { useStep } from 'hooks';
import { useState } from 'react';
import { ClassifierCard } from './ClassifierCard';
import { CsvCard } from './CsvCard';
import { MergeCard } from './MergeCard';
import { SaveDataCard } from './SavaDataCard';
import { XmlCard } from './XmlCard';

const { Step } = Steps;

/**
 * Steps to Sync
 * Import and parse BGG Collection
 * Import and parse XML Collection
 * Merge both collections
 * Update or write entries in firebase
 * @returns
 */
export function Sync() {
  const { step, goToNextStep } = useStep();
  const [csvContent, setCsvContent] = useState<UnknownDictionary[]>([]);
  const [xmlContent, setXmlContent] = useState<UnknownDictionary[]>([]);
  const [ingestedData, setIngestedData] = useState<MergedCollectionEntry[]>([]);
  const [dataToBeAdded, setDataToBeAdded] = useState<GameEntry[]>([]);
  const [classifications, setClassifications] = useState<Record<GameId, Classification>>({});

  return (
    <>
      <Layout.Content className="content">
        <Typography.Title level={1}>Sync BGG</Typography.Title>
        <Divider />
        <Row className="margin-1">
          <Steps current={step} size="small">
            <Step title="BGG Collection" />
            <Step title="BGG XML" />
            <Step title="Merge Collections" />
            <Step title="Classify Items" />
            <Step title="Save Data" />
          </Steps>
        </Row>

        {step === 0 && (
          <Row>
            <CsvCard csvContent={csvContent} setCsvContent={setCsvContent} goToNextStep={goToNextStep} />
          </Row>
        )}

        {step === 1 && (
          <Row>
            <XmlCard xmlContent={xmlContent} setXmlContent={setXmlContent} goToNextStep={goToNextStep} />
          </Row>
        )}

        {step === 2 && (
          <Row>
            <MergeCard
              csvContent={csvContent}
              xmlContent={xmlContent}
              ingestedData={ingestedData}
              setIngestedData={setIngestedData}
              goToNextStep={goToNextStep}
              setDataToBeAdded={setDataToBeAdded}
            />
          </Row>
        )}

        {step === 3 && (
          <Row>
            <ClassifierCard
              goToNextStep={goToNextStep}
              dataToBeAdded={dataToBeAdded}
              classifications={classifications}
              setClassifications={setClassifications}
            />
          </Row>
        )}

        {step === 4 && (
          <Row>
            <SaveDataCard dataToBeAdded={dataToBeAdded} classifications={classifications} />
          </Row>
        )}
      </Layout.Content>
    </>
  );
}
