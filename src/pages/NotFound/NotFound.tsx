import { Button, Result } from 'antd';
import { Content } from 'components';
import { useBackNavigation } from 'hooks/useBackNavigation';
import { ArrowLeft, SearchX } from 'lucide-react';

export function NotFound() {
  const back = useBackNavigation('/');

  return (
    <Content centered>
      <Result
        icon={<SearchX size={64} className="text-muted" />}
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" icon={<ArrowLeft />} onClick={back}>
            Back
          </Button>
        }
      />
    </Content>
  );
}
