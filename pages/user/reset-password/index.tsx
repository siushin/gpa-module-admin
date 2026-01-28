import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import Settings from '@config/defaultSettings';
import type { Engine, ISourceOptions } from '@tsparticles/engine';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import {
  FormattedMessage,
  Helmet,
  history,
  SelectLang,
  useIntl,
} from '@umijs/max';
import { Alert, App } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { resetPassword } from '@/modules/admin/services/user';
import { Footer } from '@/modules/base/components';
import { sendCaptcha } from '@/services/ant-design-pro/login';

const useStyles = createStyles(({ token }) => {
  return {
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      position: 'relative',
    },
    particles: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
    },
    content: {
      position: 'relative',
      zIndex: 1,
    },
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const ResetPasswordMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const ResetPassword: React.FC = () => {
  const [resetPasswordState, setResetPasswordState] = useState<{
    status: string;
    error?: string;
  }>({});
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
      setParticlesLoaded(true);
    });
  }, []);

  const particlesOptions: ISourceOptions = {
    background: {
      color: {
        value: '#f0f2f5',
      },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
        },
        onHover: {
          enable: true,
          mode: 'repulse',
        },
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: '#1890ff',
      },
      links: {
        color: '#1890ff',
        distance: 150,
        enable: true,
        opacity: 0.5,
        width: 1,
      },
      move: {
        direction: 'none',
        enable: true,
        outModes: {
          default: 'bounce',
        },
        random: false,
        speed: 1,
        straight: false,
      },
      number: {
        density: {
          enable: true,
        },
        value: 80,
      },
      opacity: {
        value: 0.5,
      },
      shape: {
        type: 'circle',
      },
      size: {
        value: { min: 1, max: 5 },
      },
    },
    detectRetina: true,
  };

  const handleSubmit = async (values: any) => {
    try {
      const msg = await resetPassword({
        phone: values.phone,
        code: values.captcha,
        password: values.password,
        confirm_password: values.confirm_password,
      });

      const isSuccess = (msg as any).code === 200;

      if (isSuccess) {
        message.success((msg as any).message || '密码重置成功！');
        setTimeout(() => {
          history.push('/user/login');
        }, 1500);
        return;
      }

      const errorMsg = (msg as any).message || '密码重置失败，请重试';
      message.error(errorMsg);
      setResetPasswordState({ status: 'error', error: errorMsg });
    } catch (error: any) {
      const defaultResetPasswordFailureMessage = intl.formatMessage({
        id: 'pages.resetPassword.failure',
        defaultMessage: '密码重置失败，请重试！',
      });
      const errorMsg =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        defaultResetPasswordFailureMessage;
      message.error(errorMsg);
      setResetPasswordState({ status: 'error', error: errorMsg });
    }
  };

  const { status, error } = resetPasswordState;

  return (
    <div className={styles.container}>
      {particlesLoaded && (
        <Particles
          id="tsparticles"
          options={particlesOptions}
          className={styles.particles}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}
      <Lang />
      <div className={styles.content}>
        <Helmet>
          <title>
            {intl.formatMessage({
              id: 'pages.resetPassword.subtitle',
              defaultMessage: '重置密码',
            })}
            {Settings.title && ` - ${Settings.title}`}
          </title>
        </Helmet>
        <div
          style={{
            flex: '1',
            padding: '32px 0',
          }}
        >
          <LoginForm
            styles={{
              content: {
                minWidth: 280,
                maxWidth: '75vw',
              },
            }}
            logo={<img alt="logo" src="/pokemon.png" />}
            title={process.env.UMI_APP_TITLE || 'GPAdmin管理后台'}
            subTitle={intl.formatMessage({
              id: 'pages.resetPassword.subtitle',
              defaultMessage: '重置密码',
            })}
            onFinish={async (values) => {
              await handleSubmit(values);
            }}
            submitter={{
              searchConfig: {
                submitText: intl.formatMessage({
                  id: 'pages.resetPassword.submit',
                  defaultMessage: '重置密码',
                }),
              },
            }}
          >
            {status === 'error' && error && (
              <ResetPasswordMessage content={error} />
            )}

            <ProFormText
              fieldProps={{
                size: 'large',
                prefix: <MobileOutlined />,
              }}
              name="phone"
              placeholder={intl.formatMessage({
                id: 'pages.resetPassword.phone.placeholder',
                defaultMessage: '手机号',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.resetPassword.phone.required"
                      defaultMessage="请输入手机号！"
                    />
                  ),
                },
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: (
                    <FormattedMessage
                      id="pages.resetPassword.phone.invalid"
                      defaultMessage="手机号格式错误！"
                    />
                  ),
                },
              ]}
            />
            <ProFormCaptcha
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
              }}
              captchaProps={{
                size: 'large',
              }}
              phoneName="phone"
              placeholder={intl.formatMessage({
                id: 'pages.resetPassword.captcha.placeholder',
                defaultMessage: '请输入验证码',
              })}
              captchaTextRender={(timing, count) => {
                if (timing) {
                  return `${count} ${intl.formatMessage({
                    id: 'pages.getCaptchaSecondText',
                    defaultMessage: '秒后重新获取',
                  })}`;
                }
                return intl.formatMessage({
                  id: 'pages.resetPassword.getVerificationCode',
                  defaultMessage: '获取验证码',
                });
              }}
              name="captcha"
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.resetPassword.captcha.required"
                      defaultMessage="请输入验证码！"
                    />
                  ),
                },
              ]}
              onGetCaptcha={async (phone) => {
                try {
                  const phoneNumber = phone || '';
                  if (!phoneNumber) {
                    message.error('请先输入手机号');
                    return;
                  }
                  const result = await sendCaptcha({
                    phone: phoneNumber,
                    type: 'reset_password',
                  });
                  if (result && (result as any).code === 200) {
                    message.success(
                      (result as any).message || '验证码发送成功',
                    );
                  } else {
                    const errorMsg =
                      (result as any)?.message || '获取验证码失败，请重试';
                    message.error(errorMsg);
                  }
                } catch (error: any) {
                  const errorMsg =
                    error?.response?.data?.message ||
                    error?.data?.message ||
                    error?.message ||
                    '获取验证码失败，请重试';
                  message.error(errorMsg);
                  throw error;
                }
              }}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.resetPassword.password.placeholder',
                defaultMessage: '请输入新密码（至少6位）',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.resetPassword.password.required"
                      defaultMessage="请输入新密码！"
                    />
                  ),
                },
                {
                  min: 6,
                  message: (
                    <FormattedMessage
                      id="pages.resetPassword.password.min"
                      defaultMessage="密码长度至少6位！"
                    />
                  ),
                },
              ]}
            />
            <ProFormText.Password
              name="confirm_password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.resetPassword.confirmPassword.placeholder',
                defaultMessage: '请再次输入新密码',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.resetPassword.confirmPassword.required"
                      defaultMessage="请再次输入新密码！"
                    />
                  ),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'pages.resetPassword.confirmPassword.notMatch',
                          defaultMessage: '两次输入的密码不一致',
                        }),
                      ),
                    );
                  },
                }),
              ]}
              dependencies={['password']}
            />
          </LoginForm>
          <div
            style={{
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {intl.formatMessage({
                id: 'pages.resetPassword.rememberPassword',
                defaultMessage: '想起密码了？',
              })}
            </span>{' '}
            <a
              onClick={() => {
                history.push('/user/login');
              }}
            >
              {intl.formatMessage({
                id: 'pages.resetPassword.backToLogin',
                defaultMessage: '返回登录',
              })}
            </a>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default ResetPassword;
