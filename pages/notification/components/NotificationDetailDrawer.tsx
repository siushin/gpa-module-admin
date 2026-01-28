import { Drawer, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

const { Title, Text } = Typography;

interface NotificationDetailDrawerProps {
  visible: boolean;
  record: any;
  type: 'system_notification' | 'message' | 'announcement';
  onClose: () => void;
}

const NotificationDetailDrawer: React.FC<NotificationDetailDrawerProps> = ({
  visible,
  record,
  type,
  onClose,
}) => {
  if (!record) return null;

  const now = dayjs();
  let startTime = null;
  let endTime = null;
  let status = '';
  let statusColor = '';
  let timeText = '';

  if (record.start_time) {
    startTime = dayjs(record.start_time);
  }
  if (record.end_time) {
    endTime = dayjs(record.end_time);
  }

  // 判断生效时间状态
  if (!startTime && !endTime) {
    if (record.created_at) {
      const createdTime = dayjs(record.created_at);
      timeText = createdTime.format('YYYY-MM-DD HH:mm:ss');
      status = '已生效';
      statusColor = 'blue';
    }
  } else if (startTime && endTime) {
    const startStr = startTime.format('YYYY-MM-DD HH:mm:ss');
    const endStr = endTime.format('YYYY-MM-DD HH:mm:ss');
    timeText = `${startStr} ~ ${endStr}`;

    if (now.isBefore(startTime)) {
      status = '未开始';
      statusColor = 'orange';
    } else if (now.isAfter(endTime)) {
      status = '已结束';
      statusColor = 'red';
    } else {
      status = '进行中';
      statusColor = 'green';
    }
  } else if (startTime) {
    const startStr = startTime.format('YYYY-MM-DD HH:mm:ss');
    timeText = `${startStr} ~ 长期有效`;
    if (now.isBefore(startTime)) {
      status = '未开始';
      statusColor = 'orange';
    } else {
      status = '进行中';
      statusColor = 'green';
    }
  } else if (endTime) {
    const endStr = endTime.format('YYYY-MM-DD HH:mm:ss');
    timeText = `立即生效 ~ ${endStr}`;
    if (now.isAfter(endTime)) {
      status = '已结束';
      statusColor = 'red';
    } else {
      status = '进行中';
      statusColor = 'green';
    }
  }

  // 平台名称映射
  const platformMap: Record<string, string> = {
    all: '全平台',
    user: '用户端',
    admin: '管理端',
    miniapp: '小程序',
  };

  // 获取目标平台显示文本
  const getPlatformText = () => {
    if (!record.target_platform) return '';
    const platforms = record.target_platform
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean);
    if (platforms.length === 0) return '';

    const sortOrder: Record<string, number> = {
      all: 0,
      user: 1,
      admin: 2,
      miniapp: 3,
    };

    const sortedPlatforms = platforms
      .sort((a: string, b: string) => {
        const orderA = sortOrder[a] ?? 999;
        const orderB = sortOrder[b] ?? 999;
        return orderA - orderB;
      })
      .map((p: string) => platformMap[p] || p);

    return sortedPlatforms.join('、');
  };

  // 通知类型映射
  const typeMap: Record<string, { text: string; color: string }> = {
    system: { text: '系统通知', color: 'blue' },
    business: { text: '业务通知', color: 'green' },
    activity: { text: '活动通知', color: 'orange' },
    other: { text: '其他', color: 'default' },
  };

  return (
    <Drawer
      title={null}
      placement="right"
      width={800}
      open={visible}
      onClose={onClose}
      closable={true}
    >
      <div style={{ padding: '0 24px' }}>
        {/* 标题 */}
        <Title level={2} style={{ marginBottom: 24 }}>
          {record.title}
        </Title>

        {/* 作者等信息 */}
        <Space size="large" wrap style={{ marginBottom: 32, color: '#666' }}>
          {type === 'system_notification' && record.type && (
            <Space>
              <Text type="secondary">类型：</Text>
              <Tag color={typeMap[record.type]?.color || 'default'}>
                {typeMap[record.type]?.text || record.type}
              </Tag>
            </Space>
          )}
          {record.target_platform && (
            <Space>
              <Text type="secondary">目标平台：</Text>
              <Text>{getPlatformText()}</Text>
            </Space>
          )}
          {record.created_at && (
            <Space>
              <Text type="secondary">发布时间：</Text>
              <Text>
                {dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </Space>
          )}
          {timeText && (
            <Space>
              <Text type="secondary">生效时间：</Text>
              <Text>{timeText}</Text>
              <Tag color={statusColor}>{status}</Tag>
            </Space>
          )}
          {type === 'announcement' && record.position && (
            <Space>
              <Text type="secondary">显示位置：</Text>
              <Text>{record.position}</Text>
            </Space>
          )}
          {type === 'message' && (
            <>
              {record.sender_name && (
                <Space>
                  <Text type="secondary">发送者：</Text>
                  <Text>{record.sender_name}</Text>
                </Space>
              )}
              {record.receiver_name && (
                <Space>
                  <Text type="secondary">接收者：</Text>
                  <Text>{record.receiver_name}</Text>
                </Space>
              )}
            </>
          )}
          <Space>
            <Text type="secondary">状态：</Text>
            <Tag
              color={
                record.status === 1
                  ? 'success'
                  : record.status === 0
                    ? 'error'
                    : 'default'
              }
            >
              {type === 'message'
                ? record.status === 1
                  ? '已读'
                  : '未读'
                : record.status === 1
                  ? '启用'
                  : '禁用'}
            </Tag>
          </Space>
        </Space>

        {/* 分隔线 */}
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            marginBottom: 32,
          }}
        />

        {/* 正文内容 */}
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: '#333',
            wordBreak: 'break-word',
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: 富文本内容需要渲染HTML
          dangerouslySetInnerHTML={{ __html: record.content || '' }}
        />
      </div>
    </Drawer>
  );
};

export default NotificationDetailDrawer;
