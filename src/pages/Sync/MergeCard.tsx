import { Alert, Button, Card, Col, Image, Row, Spin, Statistic, Table, Typography } from 'antd';
import { useQueryShelvedGames } from 'hooks';
import { orderBy } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';

import {
  checkKeyValues,
  getShelvedGamesIdDictionary,
  mergeCollections,
  prepareRawGameShelfEntry,
  transformCSV,
  transformXML,
} from './utils';

const { Paragraph } = Typography;

type MergeCardProps = {
  csvContent: UnknownDictionary[];
  xmlContent: UnknownDictionary[];
  goToNextStep: GenericFunction;
  ingestedData: MergedCollectionEntry[];
  setIngestedData: GenericFunction;
  setDataToBeAdded: GenericFunction;
};

export function MergeCard({
  csvContent,
  xmlContent,
  ingestedData,
  setIngestedData,
  goToNextStep,
  setDataToBeAdded,
}: MergeCardProps) {
  useEffect(() => {
    const csv = transformCSV(csvContent);
    const xml = transformXML(xmlContent);
    const merged = mergeCollections(csv, xml);
    const gameEntries = prepareRawGameShelfEntry(merged);

    setIngestedData(orderBy(gameEntries, 'name'));
  }, [csvContent, xmlContent, setIngestedData]);

  const { isLoading, isSuccess, response: shelvedGames, isError, error } = useQueryShelvedGames();

  checkKeyValues(ingestedData);

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
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
  ];

  const shelvedGamesIdDictionary = useMemo(
    () => (shelvedGames ? getShelvedGamesIdDictionary(shelvedGames) : {}),
    [shelvedGames]
  );
  const newEntries = useMemo(
    () => ingestedData.filter((entry) => shelvedGamesIdDictionary![entry.id] === undefined),
    [ingestedData, shelvedGamesIdDictionary]
  );

  const handleSyncNew = useCallback(() => {
    setDataToBeAdded(newEntries);
    goToNextStep();
  }, [goToNextStep, newEntries, setDataToBeAdded]);

  const handleSyncAll = useCallback(() => {
    setDataToBeAdded(ingestedData);
    goToNextStep();
  }, [goToNextStep, ingestedData, setDataToBeAdded]);

  return (
    <Card title="Merge Collections" className="full-width margin-1">
      <Paragraph>Parse, merge, and transform collections into a GameShelf entry</Paragraph>

      {isLoading && <Spin />}

      {isError && (
        <Alert type="error" message="Failed to load shelved games" description={JSON.stringify(error)} />
      )}

      {isSuccess && (
        <Row gutter={16} className="margin-1">
          <Col span={12}>
            <Statistic title="New Entries" value={Object.keys(newEntries).length ?? 0} />
            <Button type="primary" onClick={handleSyncNew}>
              Add New Only
            </Button>
          </Col>

          <Col span={12}>
            <Statistic title="Total Imported Entries" value={ingestedData?.length ?? 0} />
            <Button type="primary" danger onClick={handleSyncAll}>
              Resync All
            </Button>
          </Col>
        </Row>
      )}

      <Table dataSource={newEntries} columns={columns} />
    </Card>
  );
}
