import { Divider, Layout, Row, Steps, Typography } from 'antd';
import { useStep } from 'hooks';
import { useState } from 'react';
import type { BGGCollection, XMLData } from '../../types/bgg';
import { ClassifierCard } from './ClassifierCard';
import { CsvCard } from './CsvCard';
import { MergeCard } from './MergeCard';
import { SaveDataCard } from './SavaDataCard';
import { XmlCard } from './XmlCard';

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
  const [csvContent, setCsvContent] = useState<BGGCollection[]>([]);
  const [xmlContent, setXmlContent] = useState<XMLData[]>([]);
  const [ingestedData, setIngestedData] = useState<GameEntry[]>([]);
  const [dataToBeAdded, setDataToBeAdded] = useState<GameEntry[]>([]);
  const [classifications, setClassifications] = useState<Record<GameId, Classification>>({});

  return (
    <Layout.Content className="p-4">
      <Typography.Title level={1}>Settings</Typography.Title>
      <Typography.Title level={2}>Sync BGG</Typography.Title>
      <Divider />
      <Row className="m-4">
        <Steps
          current={step}
          size="small"
          items={['BGG Collection', 'BGG XML', 'Merge Collections', 'Classify Items', 'Save Data'].map(
            (title) => ({ title }),
          )}
        />
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
  );
}
