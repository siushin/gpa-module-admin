import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import classNames from 'classnames';
import { useMergedState } from 'rc-util';
import React, { type FC, useState } from 'react';
import useStyles from './index.style';

const { CheckableTag } = Tag;
export interface TagSelectOptionProps {
  value: string | number;
  style?: React.CSSProperties;
  checked?: boolean;
  onChange?: (value: string | number, state: boolean) => void;
  children?: React.ReactNode;
}
const TagSelectOption: React.FC<TagSelectOptionProps> & {
  isTagSelectOption: boolean;
} = ({ children, checked, onChange, value }) => (
  <CheckableTag
    checked={!!checked}
    key={value}
    onChange={(state) => onChange?.(value, state)}
  >
    {children}
  </CheckableTag>
);

TagSelectOption.isTagSelectOption = true;

type TagSelectOptionElement = React.ReactElement<
  TagSelectOptionProps,
  typeof TagSelectOption
>;

export interface TagSelectProps {
  onChange?: (value: (string | number)[]) => void;
  expandable?: boolean;
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  defaultAllChecked?: boolean;
  style?: React.CSSProperties;
  hideCheckAll?: boolean;
  actionsText?: {
    expandText?: React.ReactNode;
    collapseText?: React.ReactNode;
    selectAllText?: React.ReactNode;
  };
  className?: string;
  Option?: TagSelectOptionProps;
  children?: TagSelectOptionElement | TagSelectOptionElement[];
}
const TagSelect: FC<TagSelectProps> & {
  Option: typeof TagSelectOption;
} = (props) => {
  const { styles } = useStyles();
  const {
    children,
    hideCheckAll = false,
    defaultAllChecked = false,
    className,
    style,
    expandable,
    actionsText = {},
  } = props;
  const [expand, setExpand] = useState<boolean>(false);
  // 用于跟踪"全部"是否被用户明确点击过（而不是因为所有选项被选中而自动选中）
  const [allExplicitlyChecked, setAllExplicitlyChecked] =
    useState<boolean>(defaultAllChecked);

  const [value, setValue] = useMergedState<(string | number)[]>(
    props.defaultValue || [],
    {
      value: props.value,
      defaultValue: props.defaultValue,
      onChange: props.onChange,
    },
  );

  const isTagSelectOption = (node: TagSelectOptionElement) =>
    node?.type &&
    (node.type.isTagSelectOption ||
      node.type.displayName === 'TagSelectOption');
  const getAllTags = () => {
    const childrenArray = React.Children.toArray(
      children,
    ) as TagSelectOptionElement[];
    const checkedTags = childrenArray
      .filter((child) => isTagSelectOption(child))
      .map((child) => child.props.value);
    return checkedTags || [];
  };
  const onSelectAll = (checked: boolean) => {
    if (checked) {
      // 用户选择了"全部"，清空所有具体选项，只保留"全部"的选中状态
      setAllExplicitlyChecked(true);
      setValue([]); // 清空具体选项
    } else {
      // 用户取消选中"全部"
      setAllExplicitlyChecked(false);
      setValue([]);
    }
  };
  const handleTagChange = (tag: string | number, checked: boolean) => {
    // 当用户点击具体选项时，先清除"全部"的选中状态
    setAllExplicitlyChecked(false);

    const checkedTags: (string | number)[] = [...(value || [])];
    const index = checkedTags.indexOf(tag);
    if (checked && index === -1) {
      checkedTags.push(tag);
    } else if (!checked && index > -1) {
      checkedTags.splice(index, 1);
    }
    setValue(checkedTags);
  };
  // "全部"只在用户明确点击时才显示为选中状态
  // 当选择了具体选项时，"全部"不应该被选中
  const checkedAll = allExplicitlyChecked && (value?.length || 0) === 0;
  const {
    expandText = '展开',
    collapseText = '收起',
    selectAllText = '全部',
  } = actionsText;
  const cls = classNames(styles.tagSelect, className, {
    [styles.hasExpandTag]: expandable,
    [styles.expanded]: expand,
  });
  return (
    <div className={cls} style={style}>
      {hideCheckAll ? null : (
        <CheckableTag
          checked={checkedAll}
          key="tag-select-__all__"
          onChange={onSelectAll}
        >
          {selectAllText}
        </CheckableTag>
      )}
      {children &&
        React.Children.map(children, (child: TagSelectOptionElement) => {
          if (isTagSelectOption(child)) {
            return React.cloneElement(child, {
              key: `tag-select-${child.props.value}`,
              value: child.props.value,
              checked: value && value.indexOf(child.props.value) > -1,
              onChange: handleTagChange,
            });
          }
          return child;
        })}
      {expandable && (
        <a
          className={styles.trigger}
          onClick={() => {
            setExpand(!expand);
          }}
        >
          {expand ? (
            <>
              {collapseText} <UpOutlined />
            </>
          ) : (
            <>
              {expandText}
              <DownOutlined />
            </>
          )}
        </a>
      )}
    </div>
  );
};
TagSelect.Option = TagSelectOption;
export default TagSelect;
