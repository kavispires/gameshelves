import { Button, Card, Image, Table, Typography } from 'antd';
import { useEffect } from 'react';
import {
  checkKeyValues,
  mergeCollections,
  prepareRawGameShelfEntry,
  transformCSV,
  transformXML,
} from './utils';

const { Paragraph } = Typography;

interface MergeCardProps {
  csvContent: UnknownDictionary[];
  xmlContent: UnknownDictionary[];
  goToNextStep: GenericFunction;
  data: MergedCollectionEntry[];
  setData: GenericFunction;
}

export function MergeCard({ csvContent, xmlContent, data, setData, goToNextStep }: MergeCardProps) {
  useEffect(() => {
    const csv = transformCSV(csvContent);
    const xml = transformXML(xmlContent);
    const merged = mergeCollections(csv, xml);
    const gameEntries = prepareRawGameShelfEntry(merged);
    setData(gameEntries);
  }, []);

  console.log({ data });

  checkKeyValues(data);

  const columns = [
    {
      title: 'Cover',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      render: (value: string) => <Image src={value} width={50} />,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => (a.name < b.name ? -1 : 1),
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      sorter: (a: any, b: any) => a.rating - b.rating,
    },
  ];

  return (
    <Card title="Merge Collections" className="full-width margin-1">
      <Paragraph>Parse, merge, and transform collections into a GameShelf entry</Paragraph>

      <Table dataSource={data} columns={columns} />

      <Button type="primary" disabled={csvContent.length === 0} onClick={goToNextStep}>
        Continue
      </Button>
    </Card>
  );
}
