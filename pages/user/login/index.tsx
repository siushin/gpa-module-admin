import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  QqOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WechatOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
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
  useModel,
} from '@umijs/max';
import { Alert, App, notification, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { getUserMenus } from '@/modules/admin/services/user';
import { Footer } from '@/modules/base/components';
import { saveToken } from '@/modules/base/utils/token';
import {
  login,
  loginByCode,
  sendCaptcha,
} from '@/services/ant-design-pro/login';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
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

const ActionIcons = () => {
  const { styles } = useStyles();

  return (
    <>
      <WechatOutlined key="WechatOutlined" className={styles.action} />
      <QqOutlined key="QqOutlined" className={styles.action} />
      <WeiboCircleOutlined
        key="WeiboCircleOutlined"
        className={styles.action}
      />
      <TaobaoCircleOutlined
        key="TaobaoCircleOutlined"
        className={styles.action}
      />
      <AlipayCircleOutlined
        key="AlipayCircleOutlined"
        className={styles.action}
      />
    </>
  );
};

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{
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

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  // 粒子效果初始化
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
      setParticlesLoaded(true);
    });
  }, []);

  // 粒子效果配置
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

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // 根据登录类型调用不同的登录接口
      // 使用 skipErrorHandler 避免错误被拦截器处理，由我们的 catch 块统一处理
      let msg: any;
      if (type === 'phone') {
        // 手机号验证码登录
        const formValues = values as any;
        msg = await loginByCode(
          {
            phone: formValues.mobile || '',
            code: formValues.captcha || '',
          },
          { skipErrorHandler: true },
        );
      } else {
        // 账号密码登录
        msg = await login({ ...values, type }, { skipErrorHandler: true });
      }

      // 后端统一响应标准：code === 200 表示成功
      const isSuccess = (msg as any).code === 200;

      if (isSuccess) {
        const responseData = (msg as any).data;

        // 从响应中提取 access_token 和过期时间
        // 响应格式：{ code: 200, data: { token: { access_token: "...", expires_in: 7200 } } }
        const tokenData = responseData?.token;
        if (tokenData?.access_token) {
          const expiresIn = tokenData.expires_in || 7200; // 默认7200秒（2小时）
          saveToken(tokenData.access_token, expiresIn);
        }

        const userData = responseData;
        const defaultAvatar = '/BiazfanxmamNRoxxVxka.png';
        const currentUser: API.CurrentUser = {
          name: userData.nickname || userData.username, // 优先使用 nickname，没有则使用 username
          avatar: userData.avatar || defaultAvatar, // 如果没有头像，使用默认头像
          userid: userData.id?.toString(),
          email: userData.social_accounts?.find(
            (item: any) => item.social_type === 'email',
          )?.social_account,
          phone: userData.social_accounts?.find(
            (item: any) => item.social_type === 'phone',
          )?.social_account,
          access: userData.currentAuthority || userData.account_type,
        };

        // 保存用户信息到 localStorage，避免刷新后重新请求接口
        localStorage.setItem('userInfo', JSON.stringify(currentUser));

        // 获取用户菜单数据
        try {
          const menuResponse = await getUserMenus();
          if (menuResponse && (menuResponse as any).code === 200) {
            const menuData = (menuResponse as any).data || [];
            // 保存菜单数据到 localStorage
            localStorage.setItem('menuData', JSON.stringify(menuData));

            // 直接设置用户信息和菜单数据到全局状态
            flushSync(() => {
              setInitialState((s) => ({
                ...s,
                currentUser: currentUser,
                menuData: menuData,
              }));
            });
          } else {
            // 如果获取菜单失败，仍然设置用户信息
            flushSync(() => {
              setInitialState((s) => ({
                ...s,
                currentUser: currentUser,
              }));
            });
          }
        } catch (menuError) {
          console.error('获取菜单失败:', menuError);
          // 如果获取菜单失败，仍然设置用户信息
          flushSync(() => {
            setInitialState((s) => ({
              ...s,
              currentUser: currentUser,
            }));
          });
        }

        // 显示欢迎消息
        const userName = currentUser.name || '用户';
        message.success(`登录成功！欢迎，${userName}！`);

        // 标记已登录，用于显示欢迎弹窗
        sessionStorage.setItem('justLoggedIn', 'true');
        const urlParams = new URL(window.location.href).searchParams;
        // 直接跳转到工作台，避免通过根路径重定向导致的问题
        window.location.href = urlParams.get('redirect') || '/workbench';
        return;
      }
      // 登录失败，显示后端返回的错误信息
      const defaultErrorMsg =
        type === 'phone'
          ? '登录失败，请检查手机号和验证码'
          : '登录失败，请检查用户名和密码';
      const errorMsg = (msg as any).message || defaultErrorMsg;
      message.error(errorMsg);
      setUserLoginState({ ...msg, status: 'error' });
    } catch (error: any) {
      // 优先显示后端返回的错误信息
      const errorMsg =
        error?.info?.errorMessage ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        intl.formatMessage({
          id: 'pages.login.failure',
          defaultMessage: '登录失败，请重试！',
        });
      message.error(errorMsg);
      setUserLoginState({ status: 'error', type: type });
    }
  };
  const { status, type: loginType } = userLoginState;

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
              id: 'menu.login',
              defaultMessage: '登录页',
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
              id: 'pages.layouts.userLayout.title',
            })}
            initialValues={{
              autoLogin: true,
            }}
            actions={[
              <FormattedMessage
                key="loginWith"
                id="pages.login.loginWith"
                defaultMessage="其他登录方式"
              />,
              <ActionIcons key="icons" />,
            ]}
            onFinish={async (values) => {
              await handleSubmit(values as API.LoginParams);
            }}
          >
            <Tabs
              activeKey={type}
              onChange={setType}
              centered
              items={[
                {
                  key: 'account',
                  label: intl.formatMessage({
                    id: 'pages.login.accountLogin.tab',
                    defaultMessage: '账户密码登录',
                  }),
                },
                {
                  key: 'phone',
                  label: intl.formatMessage({
                    id: 'pages.login.phoneLogin.tab',
                    defaultMessage: '手机号登录',
                  }),
                },
              ]}
            />

            {status === 'error' && loginType === 'account' && (
              <LoginMessage
                content={intl.formatMessage({
                  id: 'pages.login.accountLogin.errorMessage',
                  defaultMessage: '账户或密码错误(admin)',
                })}
              />
            )}
            {type === 'account' && (
              <>
                <ProFormText
                  name="username"
                  fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                  }}
                  placeholder={intl.formatMessage({
                    id: 'pages.login.username.placeholder',
                    defaultMessage: '用户名: admin',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.username.required"
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
                    id: 'pages.login.password.placeholder',
                    defaultMessage: '密码: admin',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.password.required"
                          defaultMessage="请输入密码！"
                        />
                      ),
                    },
                  ]}
                />
              </>
            )}

            {status === 'error' && loginType === 'phone' && (
              <LoginMessage content="验证码错误" />
            )}
            {type === 'phone' && (
              <>
                <ProFormText
                  fieldProps={{
                    size: 'large',
                    prefix: <MobileOutlined />,
                  }}
                  name="mobile"
                  placeholder={intl.formatMessage({
                    id: 'pages.login.phoneNumber.placeholder',
                    defaultMessage: '手机号',
                  })}
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.phoneNumber.required"
                          defaultMessage="请输入手机号！"
                        />
                      ),
                    },
                    {
                      pattern: /^1\d{10}$/,
                      message: (
                        <FormattedMessage
                          id="pages.login.phoneNumber.invalid"
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
                  phoneName="mobile"
                  placeholder={intl.formatMessage({
                    id: 'pages.login.captcha.placeholder',
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
                      id: 'pages.login.phoneLogin.getVerificationCode',
                      defaultMessage: '获取验证码',
                    });
                  }}
                  name="captcha"
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.captcha.required"
                          defaultMessage="请输入验证码！"
                        />
                      ),
                    },
                  ]}
                  onGetCaptcha={async (phone) => {
                    try {
                      // phone 参数是表单中 phoneName="mobile" 字段的值
                      const phoneNumber = phone || '';
                      if (!phoneNumber) {
                        message.error('请先输入手机号');
                        return;
                      }
                      const result = await sendCaptcha({
                        phone: phoneNumber,
                        type: 'login',
                      });
                      // 后端返回格式：{ code: 200, message: '验证码发送成功', data: {} }
                      if (result && (result as any).code === 200) {
                        message.success(
                          (result as any).message || '验证码发送成功',
                        );
                      } else {
                        // 如果返回了message，显示message；否则显示默认错误信息
                        const errorMsg =
                          (result as any)?.message || '获取验证码失败，请重试';
                        message.error(errorMsg);
                      }
                    } catch (error: any) {
                      // 优先显示后端返回的message
                      const errorMsg =
                        error?.response?.data?.message ||
                        error?.data?.message ||
                        error?.message ||
                        '获取验证码失败，请重试';
                      message.error(errorMsg);
                      throw error; // 重新抛出错误，让组件知道获取失败
                    }
                  }}
                />
              </>
            )}
            <div
              style={{
                marginBottom: 24,
              }}
            >
              <ProFormCheckbox noStyle name="autoLogin">
                <FormattedMessage
                  id="pages.login.rememberMe"
                  defaultMessage="自动登录"
                />
              </ProFormCheckbox>
              <div style={{ float: 'right' }}>
                <a
                  style={{
                    marginRight: 16,
                  }}
                  onClick={() => {
                    history.push('/user/register');
                  }}
                >
                  <FormattedMessage
                    id="pages.login.register"
                    defaultMessage="注册账号"
                  />
                </a>
                <a
                  onClick={() => {
                    history.push('/user/reset-password');
                  }}
                >
                  <FormattedMessage
                    id="pages.login.forgotPassword"
                    defaultMessage="忘记密码 ?"
                  />
                </a>
              </div>
            </div>
          </LoginForm>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Login;
