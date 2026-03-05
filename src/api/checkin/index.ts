import request from "@/utils/request";
import AttendeesHistory from "@/views/member/attendeesHistory.vue";
import { AxiosPromise } from "axios";

export function checkinApi(data: any): AxiosPromise {
  return request({
    url: "/checkin-record",
    method: "post",
    data,
  });
}

export function getCheckDataApi(): AxiosPromise {
  return request({
    url: "/attendees/stats",
    method: "get",
  });
}

export function deleteCheckinRecordApi(id: number): AxiosPromise {
  return request({
    url: `/checkin-record/${id}`,
    method: "delete",
  });
}

export function deleteLastCheckinRecordApi(data: any): AxiosPromise {
  console.log("data", data);
  return request({
    url: `/checkin-record/undo-checkin`,
    method: "put",
    data: {
      attendeesId: data
    },
  });
}

export function downloadCheckinRecordExcelApi(): AxiosPromise {
  return request({
    url: `/checkin-record/download-excel`,
    method: "get",
    responseType: "arraybuffer",
  });
}
