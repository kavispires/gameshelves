import { Button, Card, Divider, Input, notification, Typography } from 'antd';
import { URLS } from 'utils/constants';

const { Paragraph, Link } = Typography;
const { TextArea } = Input;

interface CsvCardProps {
  csvContent: UnknownDictionary[];
  setCsvContent: Function;
  goToNextStep: GenericFunction;
}

export function CsvCard({ csvContent, setCsvContent, goToNextStep }: CsvCardProps) {
  const parseJson = (e: any) => {
    const value: string = e.target.value;

    try {
      const result = JSON.parse(value);
      setCsvContent(result);
    } catch (error) {
      notification.error({
        message: 'Failed to parse SVG JSON',
        description: JSON.stringify(error),
        placement: 'bottomLeft',
      });
    }
  };

  return (
    <Card title="BGG Collection" className="full-width margin-1">
      <Paragraph>
        Download user collection in{' '}
        <Link href={`${URLS.BGG_COLLECTION}/${process.env.REACT_APP_BGG_USERNAME}`} target="_blank">
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
