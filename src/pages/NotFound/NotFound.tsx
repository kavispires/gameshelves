import { Button, Result } from 'antd';
import { Content } from 'components';
import { useBackNavigation } from 'hooks/useBackNavigation';

export function NotFound() {
  const back = useBackNavigation('/');

  return (
    <Content centered>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={back}>
            Back
          </Button>
        }
      />
    </Content>
  );
}
