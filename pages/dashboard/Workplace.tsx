import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, theme } from 'antd';
import React from 'react';

const Workplace: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  // 格式化JSON显示
  const formatJSON = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
        }}
        styles={{
          body: {
            backgroundImage:
              initialState?.settings?.navTheme === 'realDark'
                ? 'linear-gradient(75deg, #1A1B1F 0%, #191C1F 100%)'
                : 'linear-gradient(75deg, #FBFDFF 0%, #F5F7FF 100%)',
          },
        }}
      >
        <pre
          style={{
            backgroundColor: token.colorBgContainer,
            padding: 16,
            borderRadius: 8,
            fontSize: '14px',
            lineHeight: '1.6',
            overflow: 'auto',
            maxHeight: '600px',
            border: `1px solid ${token.colorBorder}`,
            margin: 0,
          }}
        >
          {currentUser ? formatJSON(currentUser) : '暂无用户数据'}
        </pre>
      </Card>
    </PageContainer>
  );
};

export default Workplace;
