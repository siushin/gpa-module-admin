import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => {
  return {
    main: {
      display: 'flex',
      width: '100%',
      height: '100%',
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: token.colorBgContainer,
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        flexDirection: 'column',
      },
    },
    leftMenu: {
      width: '224px',
      borderRight: `${token.lineWidth}px solid ${token.colorSplit}`,
      '.ant-menu-inline': { border: 'none' },
      '.ant-menu-horizontal': { fontWeight: 'bold' },
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        width: '100%',
        border: 'none',
      },
    },
    right: {
      flex: '1',
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        padding: '40px',
      },
    },
  };
});

export default useStyles;
