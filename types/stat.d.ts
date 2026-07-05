interface BaseStatSetting {
    type: "basic" | "skill" | "custom";
    width?: number;
    fixed?: "left" | "right";
    style?: {
        color?: string;
        fontSize?: number;
        fontWeight?: number;
    };
}

type BasicKey =
    | "account"
    | "server"
    | "school"
    | "gender"
    | "spirit"
    | "endurance"
    | "role"
    | "teach"
    | "cd"
    | "cdRemark"
    | "remark";

interface BasicRoleStatSetting extends BaseStatSetting {
    type: "basic";
    key: "role";
    label: string;
    withSchoolIcon: boolean;
}

interface BasicTeachStatSetting extends BaseStatSetting {
    type: "basic";
    key: "teach";
    label: string;
    minLevel?: number;
    render?: "text" | "tag";
    split?: string;
    showLevel?: boolean;
}

interface BasicCdStatSetting extends BaseStatSetting {
    type: "basic";
    key: "cd";
    label: string;
    stat?: boolean; // 是否展示统计
}

interface BasicStatSetting extends BaseStatSetting {
    type: "basic";
    key: "account" | "server" | "school" | "gender" | "spirit" | "endurance" | "cdRemark" | "remark";
    label: string;
}

interface SkillStatSetting extends BaseStatSetting {
    type: "skill";
    skillId: number;
    withIcon?: boolean;
    withLabel?: boolean;
    label?: string;
    level?: "number" | "levelLabel";
}

interface CustomStatSetting extends BaseStatSetting {
    type: "custom";
    key: string;
    label: string;
    refresh: boolean;
    valueType: CustomStatValueType;
    default: CustomStatValue;
}

type CustomStatValueType = "boolean" | "number" | "string";
type CustomStatValue = boolean | number | string;

interface StatProfileSetting {
    enableEdit: boolean;
    dragSortList: string[];
    enableDragSort: boolean;
    enableSelect: boolean;
    enableIndex: boolean;
    selectRoles: string[];
    hiddenSelected: boolean;
    columns: StatSetting[];
    hiddenCustomColumns?: CustomStatSetting[];
    deletedCustomColumns?: CustomStatSetting[];
    style: {
        color: string | null;
        fontSize: number | null;
        fontWeight: number | null;
    };
    background: { level: number | null; color: string }[];
    sort: any[];
    skillColumnWidth: number;
}

interface StatProfile {
    key: string;
    name: string;
    isDefault?: boolean;
    stat: StatProfileSetting;
}

type StatSetting =
    | BasicCdStatSetting
    | BasicTeachStatSetting
    | BasicRoleStatSetting
    | BasicStatSetting
    | SkillStatSetting
    | CustomStatSetting;

interface StatTableDataRow {
    id: string;
    account: string;
    server: string;
    role: string;
    school: string;
    schoolId: number;
    gender: string;
    spirit: number;
    endurance: number;
    cd: boolean;
    cdRemark: string;
    remark: string;
    teach: [number, string[]][];
    [key: `skill-${number}`]: number;
    [key: `custom-${string}`]: any;
    [key: `skill-book-${number}`]: number[];
    roleSearchKey?: string;
    default: "-";
}
