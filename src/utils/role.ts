import mountGroupData from "@jx3box/jx3box-data/data/xf/mount_group.json";
import xfData from "@jx3box/jx3box-data/data/xf/xf.json";

const treatKungfuIds = new Set<number>((mountGroupData.mount_group?.["治疗"] || []).map(Number));

const treatSchoolIds = new Set<number>(
    Object.values(xfData)
        .filter((xf) => treatKungfuIds.has(Number(xf.id)))
        .map((xf) => Number(xf.school))
);

export const canSchoolTreat = (schoolId?: SchoolIds | null) => {
    if (schoolId === null || schoolId === undefined) return false;
    return treatSchoolIds.has(Number(schoolId));
};

export const getDefaultCanTreat = (schoolId?: SchoolIds | null) => {
    return canSchoolTreat(schoolId);
};

export const normalizeCanTreat = (role: Pick<Role, "schoolId" | "canTreat">) => {
    if (!canSchoolTreat(role.schoolId)) return false;
    return role.canTreat ?? true;
};
