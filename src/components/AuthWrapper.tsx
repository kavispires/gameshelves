import { Alert, Button, Form, Input, Modal, Result, Spin } from 'antd';
import { type PropsWithChildren, useState } from 'react';
import { type SignInProps, useAuthContext } from 'services/AuthProvider';

function LoginModal({ onClose }: { onClose: () => void }) {
  const { signIn, isSigningIn } = useAuthContext();
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: SignInProps) {
    setError(null);
    try {
      await signIn(values);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <Modal
      open
      title="Login"
      okText="Login"
      confirmLoading={isSigningIn}
      okButtonProps={{ htmlType: 'submit', form: 'sign-in', disabled: isSigningIn }}
      cancelButtonProps={{ disabled: isSigningIn }}
      closable={!isSigningIn}
      mask={{ closable: !isSigningIn }}
      keyboard={!isSigningIn}
      onCancel={onClose}
    >
      <Form<SignInProps>
        id="sign-in"
        name="sign-in"
        aria-label="Sign in"
        layout="vertical"
        onFinish={onFinish}
      >
        {error && <Alert type="error" title="Unable to sign in" description={error} showIcon />}
        <Form.Item
          label="E-mail"
          name="email"
          rules={[
            { required: true, message: 'Enter your email.' },
            { type: 'email', message: 'Enter a valid email.' },
          ]}
        >
          <Input type="email" autoComplete="username" disabled={isSigningIn} />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Enter your password.' }]}
        >
          <Input.Password autoComplete="current-password" disabled={isSigningIn} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function SignedOutGate() {
  const [openLogin, setOpenLogin] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center">
      <Alert
        type="info"
        title="You are not logged in"
        description="You can't use this app unless you are logged in."
        showIcon
        action={
          <Button type="primary" ghost onClick={() => setOpenLogin(true)}>
            Login
          </Button>
        }
      />
      {openLogin && <LoginModal onClose={() => setOpenLogin(false)} />}
    </div>
  );
}

export function AuthWrapper({ children }: PropsWithChildren) {
  const { user, isLoading, error } = useAuthContext();

  if (isLoading) {
    return (
      <div role="status" aria-label="Verifying auth..." className="grid min-h-screen place-items-center">
        <Spin size="large" description="Verifying auth...">
          <div className="h-screen w-screen" />
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Unable to verify authentication"
        subTitle={error.message}
        extra={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    );
  }

  if (!user) {
    return <SignedOutGate />;
  }

  return children;
}
