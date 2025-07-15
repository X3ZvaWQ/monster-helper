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

interface BasicStatSetting extends BaseStatSetting {
    type: "basic";
    key: "account" | "server" | "school" | "gender" | "spirit" | "endurance";
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

type StatSetting = BasicRoleStatSetting | BasicStatSetting | SkillStatSetting;

interface StatTableDataRow {
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
    [key: `skill-${number}`]: number;
    default: "-";
}
