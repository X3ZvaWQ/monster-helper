interface BaseStatSetting {
    type: "basic" | "skill";
    width?: number;
    fixed?: "left" | "right";
    style?: {
        color?: string;
        fontSize?: string;
        fontWeight?: string;
    };
}

type BasicKey = "account" | "server" | "school" | "gender" | "spirit" | "endurance" | "role";

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

interface BasicStatSetting extends BaseStatSetting {
    type: "basic";
    key: "account" | "server" | "school" | "gender" | "spirit" | "endurance" | "cd" | "cdRemark" | "remark";
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

type StatSetting = BasicTeachStatSetting | BasicRoleStatSetting | BasicStatSetting | SkillStatSetting;

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
    default: "-";
}
