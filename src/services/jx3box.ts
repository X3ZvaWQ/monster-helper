import { fetch } from './fetch';

export const getJx3boxPost = async (id: number) => {
    return fetch(`https://cms.jx3box.com/api/cms/post/${id}`, {
        method: "GET",
    })
        .then((res) => {
            return res.json();
        })
        .then((res) => {
            return res.data;
        });
};
