import {
  Avatar,
  Button,
  Card,
  Descriptions,
  InputNumber,
  Popconfirm,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import { GameCover } from 'components';
import { useStep } from 'hooks';
import type { Dispatch, SetStateAction } from 'react';
import { BOX_SIZES, GAME_TYPES } from 'utils/constants';
import { DEFAULT_BOX_DIMENSIONS } from './constants';

const { Paragraph } = Typography;

type ClassifierCardProps = {
  goToNextStep: () => void;
  dataToBeAdded: GameEntry[];
  classifications: Record<GameId, Classification>;
  setClassifications: Dispatch<SetStateAction<Record<GameId, Classification>>>;
};

export function ClassifierCard({
  goToNextStep,
  dataToBeAdded,
  classifications,
  setClassifications,
}: ClassifierCardProps) {
  const { step: currentIndex, goToNextStep: nextIndex, goToPreviousStep: previousIndex } = useStep(0);

  const currentGame = dataToBeAdded[currentIndex];
  return (
    <Card
      title={`Classify entries (${currentIndex + 1} out of ${dataToBeAdded.length})`}
      className="w-full m-4"
    >
      <Paragraph>Add additional data to all new entries</Paragraph>

      {
        <GameClassifier
          game={currentGame}
          classifications={
            classifications[currentGame.id] ?? {
              id: currentGame.id,
              type: currentGame.type ?? 'unknown',
              box: 'unknown',
              shelfId: 'unshelved',
              width: 0,
              height: 0,
              depth: 0,
            }
          }
          setClassifications={setClassifications}
        />
      }

      <Space className="m-4 flex justify-center">
        <Button disabled={currentIndex === 0} onClick={previousIndex}>
          Previous Game
        </Button>
        <Button disabled={currentIndex === dataToBeAdded.length - 1} onClick={nextIndex}>
          Next Game
        </Button>
        <Popconfirm title="Are you sure you want to stop here and save?" onConfirm={goToNextStep}>
          <Button type="primary">Save Data</Button>
        </Popconfirm>
      </Space>
    </Card>
  );
}

type GameClassifierProps = {
  game: GameEntry;
  classifications: Classification;
  setClassifications: Dispatch<SetStateAction<Record<GameId, Classification>>>;
};

function GameClassifier({ game, classifications, setClassifications }: GameClassifierProps) {
  const updateClassifications = <K extends keyof Classification>(field: K, value: Classification[K]) => {
    setClassifications((state: Record<GameId, Classification>) => {
      const nc = { ...classifications, ...(state[game.id] ?? {}), [field]: value };
      if (field === 'type' && ['promo', 'expansion'].includes(String(value))) {
        nc.box = 'none';
      }

      return {
        ...state,
        [game.id]: nc,
      };
    });
  };

  const updateDimensions = (dimensions: BoxPresets) => {
    setClassifications((state: Record<GameId, Classification>) => {
      const nc = {
        ...classifications,
        ...(state[game.id] ?? {}),
        width: dimensions.width,
        height: dimensions.height,
        depth: dimensions.depth,
        box: dimensions.box,
      };
      return {
        ...state,
        [game.id]: nc,
      };
    });
  };

  return (
    <Descriptions
      title={`${game.name} (${game.id})`}
      bordered
      size="small"
      layout="vertical"
      column={1}
      items={[
        {
          key: 'name',
          label: 'Name',
          children: (
            <>
              <GameCover id={game.id} name={game.name} width={50} height={50} preview={false} />
              <span>{game.name}</span> {game.status === 'PREORDERED' && <Tag color="yellow">Preorder</Tag>}
            </>
          ),
        },
        {
          key: 'type',
          label: 'Type',
          children: (
            <Segmented<GameType>
              options={GAME_TYPES}
              value={classifications.type}
              onChange={(value) => updateClassifications('type', value)}
            />
          ),
        },
        {
          key: 'box',
          label: 'Box Size',
          children: (
            <Segmented<BoxSize>
              options={BOX_SIZES}
              value={classifications.box}
              onChange={(value) => updateClassifications('box', value)}
            />
          ),
        },
        {
          key: 'dimensions',
          label: 'Box Dimensions',
          children: (
            <>
              <Avatar>W</Avatar>{' '}
              <InputNumber
                aria-label="Box width"
                value={classifications.width}
                onChange={(value) => updateClassifications('width', value ?? 0)}
                min={0}
              />{' '}
              <Avatar>H</Avatar>{' '}
              <InputNumber
                aria-label="Box height"
                value={classifications.height}
                onChange={(value) => updateClassifications('height', value ?? 0)}
                min={0}
              />{' '}
              <Avatar>D</Avatar>{' '}
              <InputNumber
                aria-label="Box depth"
                value={classifications.depth}
                onChange={(value) => updateClassifications('depth', value ?? 0)}
                min={0}
              />{' '}
              <br />
              <span>Default Size:</span>{' '}
              <Segmented
                options={Object.keys(DEFAULT_BOX_DIMENSIONS)}
                onChange={(value) => updateDimensions(DEFAULT_BOX_DIMENSIONS[value])}
              />
            </>
          ),
        },
      ]}
    />
  );
}
