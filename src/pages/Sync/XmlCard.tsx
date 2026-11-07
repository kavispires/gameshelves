import { App, Button, Card, Divider, Input, Typography } from 'antd';
import type { ChangeEvent } from 'react';
import { URLS } from 'utils/constants';
import type { XMLData } from '../../types/bgg';
import { parseXmlJson } from './importData';

const { Paragraph, Link } = Typography;
const { TextArea } = Input;

interface XmlCardProps {
  xmlContent: XMLData[];
  setXmlContent: (entries: XMLData[]) => void;
  goToNextStep: () => void;
}

export function XmlCard({ xmlContent, setXmlContent, goToNextStep }: XmlCardProps) {
  const { notification } = App.useApp();
  const parseJson = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value: string = e.target.value;

    try {
      setXmlContent(parseXmlJson(value));
    } catch (error) {
      setXmlContent([]);
      notification.error({
        title: 'Failed to parse XML JSON',
        description: error instanceof Error ? error.message : String(error),
        placement: 'bottomLeft',
      });
    }
  };

  return (
    <Card title="BGG User XML" className="w-full m-4">
      <Paragraph>
        Visit the user xml collection in{' '}
        <Link href={`${URLS.BGG_XML_API_COLLECTION}/${import.meta.env.VITE_BGG_USERNAME}`} target="_blank">
          BGG
        </Link>
        . (The collection will take a few seconds/minutes to be retrieved)
      </Paragraph>

      <Divider />

      <Paragraph>
        Convert XML file to JSON{' '}
        <Link href={URLS.XML_CONVERTER} target="_blank">
          here
        </Link>
        .
      </Paragraph>

      <Divider />

      <Paragraph>Parse JSON contents here:</Paragraph>
      <TextArea placeholder="Paste JSON for BGG XML Collection" onChange={parseJson}></TextArea>

      <Divider />

      <Button type="primary" disabled={xmlContent.length === 0} onClick={goToNextStep}>
        Continue
      </Button>
    </Card>
  );
}
