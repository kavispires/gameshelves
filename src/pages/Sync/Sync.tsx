import { Divider, Layout, Row, Steps, Typography } from 'antd';
import { useStep } from 'hooks';
import { useState } from 'react';
import { CsvCard } from './CsvCard';
import { MergeCard } from './MergeCard';
import { transformCSV, transformXML } from './utils';
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
  const { step, goToPreviousStep, goToNextStep } = useStep();
  const [csvContent, setCsvContent] = useState<UnknownDictionary[]>([]);
  const [xmlContent, setXmlContent] = useState<UnknownDictionary[]>([]);
  const [data, setData] = useState<MergedCollectionEntry[]>([]);

  return (
    <>
      <Layout.Content className="content">
        <Typography.Title level={1}>Sync BGG</Typography.Title>
        <Divider />
        <Row>
          <Steps current={step} size="small">
            <Step title="BGG Collection" />
            <Step title="BGG XML" />
            <Step title="Merge Collections" />
            <Step title="Update Firebase" />
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
              data={data}
              setData={setData}
              goToNextStep={goToNextStep}
            />
          </Row>
        )}
      </Layout.Content>
    </>
  );
}
