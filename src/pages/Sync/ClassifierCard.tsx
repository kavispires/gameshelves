import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Image,
  InputNumber,
  Popconfirm,
  Segmented,
  Space,
  Typography,
} from 'antd';
import { useStep } from 'hooks';
import { BOX_SIZES, DEFAULT_BOX_DIMENSIONS, GAME_TYPES } from './constants';

const { Paragraph } = Typography;

type ClassifierCardProps = {
  goToNextStep: GenericFunction;
  dataToBeAdded: GameEntry[];
  classifications: Record<GameId, Classification>;
  setClassifications: GenericFunction;
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
      className="full-width margin-1"
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

      <Space className="margin-1 flex-center">
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
  setClassifications: GenericFunction;
};

function GameClassifier({ game, classifications, setClassifications }: GameClassifierProps) {
  const updateClassifications = (field: string, value: unknown) => {
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
      column={{ xxl: 2, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
    >
      <Descriptions.Item label="Image">
        <Image src={game.image} width={50} height={50} preview={false} />
      </Descriptions.Item>
      <Descriptions.Item label="Name">{game.name}</Descriptions.Item>
      <Descriptions.Item label="Type">
        <Segmented
          options={GAME_TYPES}
          value={classifications.type}
          onChange={(e) => updateClassifications('type', e)}
        />
      </Descriptions.Item>
      <Descriptions.Item label="Box Size">
        <Segmented
          options={BOX_SIZES}
          value={classifications.box}
          onChange={(e) => updateClassifications('box', e)}
        />
      </Descriptions.Item>
      <Descriptions.Item label="Box Dimensions">
        <Avatar>W</Avatar>{' '}
        <InputNumber
          value={classifications.width}
          onChange={(e) => updateClassifications('width', e)}
          min={0}
        />{' '}
        {/* <br /> */}
        <Avatar>H</Avatar>{' '}
        <InputNumber
          value={classifications.height}
          onChange={(e) => updateClassifications('height', e)}
          min={0}
        />{' '}
        {/* <br /> */}
        <Avatar>D</Avatar>{' '}
        <InputNumber
          value={classifications.depth}
          onChange={(e) => updateClassifications('depth', e)}
          min={0}
        />{' '}
        <br />
        <span>Default Size:</span>{' '}
        <Segmented
          options={Object.keys(DEFAULT_BOX_DIMENSIONS)}
          onChange={(e) => updateDimensions(DEFAULT_BOX_DIMENSIONS[e])}
        />
      </Descriptions.Item>
    </Descriptions>
  );
}
