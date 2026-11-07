import { Alert, Button, Card, Col, Image, Row, Spin, Statistic, Table, Typography } from 'antd';
import { useQueryShelvedGames } from 'hooks';
import { orderBy } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import type { BGGCollection, XMLData } from '../../types/bgg';

import {
  getShelvedGamesIdDictionary,
  mergeCollections,
  prepareRawGameShelfEntry,
  transformCSV,
  transformXML,
} from './utils';

const { Paragraph } = Typography;

type MergeCardProps = {
  csvContent: BGGCollection[];
  xmlContent: XMLData[];
  goToNextStep: () => void;
  ingestedData: GameEntry[];
  setIngestedData: (entries: GameEntry[]) => void;
  setDataToBeAdded: (entries: GameEntry[]) => void;
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

  const columns: import('antd').TableColumnsType<GameEntry> = [
    {
      title: 'Cover',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      render: (value: string) => <Image src={value} width={50} preview={false} />,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
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
      sorter: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
  ];

  const shelvedGamesIdDictionary = useMemo(
    () => (shelvedGames ? getShelvedGamesIdDictionary(shelvedGames) : {}),
    [shelvedGames],
  );
  const newEntries = useMemo(
    () => ingestedData.filter((entry) => shelvedGamesIdDictionary[entry.id] === undefined),
    [ingestedData, shelvedGamesIdDictionary],
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
    <Card title="Merge Collections" className="w-full m-4">
      <Paragraph>Parse, merge, and transform collections into a GameShelf entry</Paragraph>

      {isLoading && <Spin />}

      {isError && <Alert type="error" title="Failed to load shelved games" description={error?.message} />}

      {isSuccess && (
        <Row gutter={16} className="m-4">
          <Col span={12}>
            <Statistic title="New Entries" value={Object.keys(newEntries).length ?? 0} />
            <Button type="primary" onClick={handleSyncNew} disabled={newEntries.length === 0}>
              Add New Only
            </Button>
          </Col>

          <Col span={12}>
            <Statistic title="Total Imported Entries" value={ingestedData?.length ?? 0} />
            <Button type="primary" danger onClick={handleSyncAll} disabled={ingestedData.length === 0}>
              Resync All
            </Button>
          </Col>
        </Row>
      )}

      <Table rowKey="id" dataSource={newEntries} columns={columns} />
    </Card>
  );
}
