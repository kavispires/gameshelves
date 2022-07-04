import { Button, Card, Divider, Input, notification, Typography } from 'antd';
import { URLS } from 'utils/constants';

const { Paragraph, Link } = Typography;
const { TextArea } = Input;

interface XmlCardProps {
  xmlContent: UnknownDictionary[];
  setXmlContent: Function;
  goToNextStep: GenericFunction;
}

export function XmlCard({ xmlContent, setXmlContent, goToNextStep }: XmlCardProps) {
  const parseJson = (e: any) => {
    const value: string = e.target.value;

    try {
      const result = JSON.parse(value);
      setXmlContent(result?.item ?? []);
    } catch (error) {
      notification.error({
        message: 'Failed to parse SVG JSON',
        description: JSON.stringify(error),
        placement: 'bottomLeft',
      });
    }
  };

  return (
    <Card title="BGG User XML" className="full-width margin-1">
      <Paragraph>
        Visit the user xml collection in{' '}
        <Link href={`${URLS.BGG_XML_API_COLLECTION}/${process.env.REACT_APP_BGG_USERNAME}`} target="_blank">
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
