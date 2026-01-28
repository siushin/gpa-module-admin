import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
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
import { register } from '@/modules/admin/services/user';
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

const RegisterMessage: React.FC<{
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

const Register: React.FC = () => {
  const [registerState, setRegisterState] = useState<{
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
        value: 'transparent',
      },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: 'push',
        },
        onHover: {
          enable: true,
          mode: 'repulse',
        },
        resize: {
          enable: true,
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
        opacity: 0.4,
        width: 1,
      },
      collisions: {
        enable: true,
      },
      move: {
        direction: 'none',
        enable: true,
        outModes: {
          default: 'bounce',
        },
        random: false,
        speed: 2,
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
      const msg = await register({
        username: values.username,
        password: values.password,
        confirm_password: values.confirm_password,
        phone: values.phone,
        code: values.captcha,
      });

      const isSuccess = (msg as any).code === 200;

      if (isSuccess) {
        message.success((msg as any).message || '注册成功！');
        setTimeout(() => {
          history.push('/user/login');
        }, 1500);
        return;
      }

      const errorMsg = (msg as any).message || '注册失败，请重试';
      message.error(errorMsg);
      setRegisterState({ status: 'error', error: errorMsg });
    } catch (error: any) {
      const defaultRegisterFailureMessage = intl.formatMessage({
        id: 'pages.register.failure',
        defaultMessage: '注册失败，请重试！',
      });
      const errorMsg =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        defaultRegisterFailureMessage;
      message.error(errorMsg);
      setRegisterState({ status: 'error', error: errorMsg });
    }
  };

  const { status, error } = registerState;

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
      <div className={styles.content}>
        <Helmet>
          <title>
            {intl.formatMessage({
              id: 'menu.register',
              defaultMessage: '注册页',
            })}
            {Settings.title && ` - ${Settings.title}`}
          </title>
        </Helmet>
        <Lang />
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
              id: 'pages.register.subtitle',
              defaultMessage: '创建新账号',
            })}
            onFinish={async (values) => {
              await handleSubmit(values);
            }}
            submitter={{
              searchConfig: {
                submitText: intl.formatMessage({
                  id: 'pages.register.submit',
                  defaultMessage: '注册',
                }),
              },
            }}
          >
            {status === 'error' && error && <RegisterMessage content={error} />}

            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.register.username.placeholder',
                defaultMessage: '请输入用户名',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.register.username.required"
                      defaultMessage="请输入用户名!"
                    />
                  ),
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.register.password.placeholder',
                defaultMessage: '请输入密码（至少6位）',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.register.password.required"
                      defaultMessage="请输入密码！"
                    />
                  ),
                },
                {
                  min: 6,
                  message: (
                    <FormattedMessage
                      id="pages.register.password.min"
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
                id: 'pages.register.confirmPassword.placeholder',
                defaultMessage: '请再次输入密码',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.register.confirmPassword.required"
                      defaultMessage="请再次输入密码！"
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
                          id: 'pages.register.confirmPassword.notMatch',
                          defaultMessage: '两次输入的密码不一致',
                        }),
                      ),
                    );
                  },
                }),
              ]}
              dependencies={['password']}
            />
            <ProFormText
              fieldProps={{
                size: 'large',
                prefix: <MobileOutlined />,
              }}
              name="phone"
              placeholder={intl.formatMessage({
                id: 'pages.register.phone.placeholder',
                defaultMessage: '手机号',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.register.phone.required"
                      defaultMessage="请输入手机号！"
                    />
                  ),
                },
                {
                  pattern: /^1\d{10}$/,
                  message: (
                    <FormattedMessage
                      id="pages.register.phone.invalid"
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
                id: 'pages.register.captcha.placeholder',
                defaultMessage: '请输入验证码',
              })}
              captchaTextRender={(timing, count) => {
                if (timing) {
                  return `${count} ${intl.formatMessage({
                    id: 'pages.getCaptchaSecondText',
                    defaultMessage: '获取验证码',
                  })}`;
                }
                return intl.formatMessage({
                  id: 'pages.register.getVerificationCode',
                  defaultMessage: '获取验证码',
                });
              }}
              name="captcha"
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.register.captcha.required"
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
                    type: 'register',
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
            <ProFormCheckbox
              name="agreeTerms"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject(
                        new Error(
                          intl.formatMessage({
                            id: 'pages.register.agreeTerms.required',
                            defaultMessage: '请先同意服务条款和隐私政策',
                          }),
                        ),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <span>
                {intl.formatMessage({
                  id: 'pages.register.agreeTerms.label',
                  defaultMessage: '我已阅读并同意',
                })}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  《
                  {intl.formatMessage({
                    id: 'pages.register.agreeTerms.serviceTerms',
                    defaultMessage: '服务条款',
                  })}
                  》
                </a>{' '}
                {intl.formatMessage({
                  id: 'pages.register.agreeTerms.and',
                  defaultMessage: '和',
                })}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  《
                  {intl.formatMessage({
                    id: 'pages.register.agreeTerms.privacyPolicy',
                    defaultMessage: '隐私政策',
                  })}
                  》
                </a>
              </span>
            </ProFormCheckbox>
          </LoginForm>
          <div
            style={{
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {intl.formatMessage({
                id: 'pages.register.haveAccount',
                defaultMessage: '已有账户？',
              })}
            </span>{' '}
            <a
              onClick={() => {
                history.push('/user/login');
              }}
            >
              {intl.formatMessage({
                id: 'pages.register.goToLogin',
                defaultMessage: '去登录',
              })}
            </a>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Register;
