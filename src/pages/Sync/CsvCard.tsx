import { App, Button, Card, Divider, Input, Typography } from 'antd';
import type { ChangeEvent } from 'react';
import { URLS } from 'utils/constants';
import type { BGGCollection } from '../../types/bgg';
import { parseCsvJson } from './importData';

const { Paragraph, Link } = Typography;
const { TextArea } = Input;

interface CsvCardProps {
  csvContent: BGGCollection[];
  setCsvContent: (entries: BGGCollection[]) => void;
  goToNextStep: () => void;
}

export function CsvCard({ csvContent, setCsvContent, goToNextStep }: CsvCardProps) {
  const { notification } = App.useApp();
  const parseJson = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value: string = e.target.value;

    try {
      setCsvContent(parseCsvJson(value));
    } catch (error) {
      setCsvContent([]);
      notification.error({
        title: 'Failed to parse CSV JSON',
        description: error instanceof Error ? error.message : String(error),
        placement: 'bottomLeft',
      });
    }
  };

  return (
    <Card title="BGG Collection" className="w-full m-4">
      <Paragraph>
        Download user collection in{' '}
        <Link href={`${URLS.BGG_COLLECTION}/${import.meta.env.VITE_BGG_USERNAME}`} target="_blank">
          BGG
        </Link>
        .
      </Paragraph>

      <Divider />

      <Paragraph>
        Convert CSV file to JSON{' '}
        <Link href={URLS.CVS_CONVERTER} target="_blank">
          here
        </Link>
        .
      </Paragraph>

      <Divider />

      <Paragraph>Parse JSON contents here:</Paragraph>
      <TextArea placeholder="Paste JSON for BGG Collection" onChange={parseJson}></TextArea>

      <Divider />

      <Button type="primary" disabled={csvContent.length === 0} onClick={goToNextStep}>
        Continue
      </Button>
    </Card>
  );
}
