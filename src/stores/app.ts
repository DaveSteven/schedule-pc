import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import {
  queryMyFollowerSchedule,
  queryUserFollower,
  queryMyLeaderSchedule,
  queryAttention,
  queryLeaders,
} from "@/service/api";
import type { QueryAttentionData, UserFollowerData } from "@/service/types";

export type UserSwitchType = "user" | "follow" | "leader" | "tec" | "meeting";

interface UserSwitchItem {
  name: string;
  value: boolean;
  type: UserSwitchType;
}

export interface FollowerItem {
  followUserId: string;
  followUserName: string;
  imgUrl?: string;
  leaderSort: number;
}

export interface LeaderItem {
  userId: string;
  userName: string;
  imgUrl?: string;
  leaderSort: number;
}

interface UserFollowerItem {
  userId: string;
  userName: string;
  imgUrl?: string;
  leaderSort?: number;
}

interface LeaderFollowerItem {
  followUserId: string;
  followUserName: string;
  imgUrl?: string;
}

// 默认的用户开关设置
const defaultUserSwitches: UserSwitchItem[] = [
  { name: "关注", type: "follow", value: true },
  { name: "领导", type: "leader", value: true },
  { name: "科技", type: "tec", value: true },
  { name: "会议室", type: "meeting", value: true },
];

export const useAppStore = defineStore("app", {
  state: () => {
    // 使用useLocalStorage来缓存用户开关设置
    const userSwitches = useLocalStorage<UserSwitchItem[]>(
      "schedule-mobile-user-switches",
      defaultUserSwitches,
      {
        deep: true, // 深度监听变化
      }
    );

    return {
      isSideNavShow: false,
      userSwitches,
      followers: [] as FollowerItem[],
      leaders: [] as LeaderItem[],
      userFollowers: [] as UserFollowerItem[],
      leadersIFollow: [] as LeaderFollowerItem[],
      whoFollowLeader: [] as UserFollowerItem[],
    };
  },
  getters: {
    // 获取启用的用户类型列表
    enabledUserTypes: (state) => {
      return state.userSwitches
        .filter((item) => item.value)
        .map((item) => item.type);
    },
  },
  actions: {
    setSideNavShow(show: boolean) {
      this.isSideNavShow = show;
    },
    setUserSwitch(type: UserSwitchType, value: boolean) {
      const switchItem = this.userSwitches.find((item) => item.type === type);
      if (switchItem) {
        switchItem.value = value;
      }
    },
    toggleUserSwitch(type: UserSwitchType) {
      const switchItem = this.userSwitches.find((item) => item.type === type);
      if (switchItem) {
        switchItem.value = !switchItem.value;
      }
    },
    // 重置用户开关设置为默认值
    resetUserSwitches() {
      this.userSwitches = [...defaultUserSwitches];
    },
    // 设置我关注的人数据
    setFollowers(followers: FollowerItem[]) {
      this.followers = followers;
    },
    // 获取我关注的人数据
    async fetchFollowers() {
      try {
        const response = await queryAttention({ userId: "123456" });
        if (response.status === "0") {
          // 转换数据类型，添加缺失的 leaderSort 字段
          const followers = response.data.map((item: QueryAttentionData) => ({
            followUserId: item.followUserId,
            followUserName: item.followUserName,
            imgUrl: item.avatarUrl,
            leaderSort: 0, // 默认值
          }));
          this.setFollowers(followers);
        }
      } catch (error) {
        console.error("获取我关注的人数据失败:", error);
      }
    },
    // 设置领导数据
    setLeaders(leaders: LeaderItem[]) {
      this.leaders = leaders;
    },
    // 获取领导数据
    async fetchLeaders() {
      try {
        const response = await queryLeaders();
        // 转换数据类型，从日程数据中提取领导信息
        const leaders = response.data.map((leaderData: any) => ({
          userId: leaderData.userId,
          userName: leaderData.userName,
          imgUrl: leaderData.imgUrl,
          leaderSort: 0, // 默认值
        }));
        this.setLeaders(leaders);
      } catch (error) {
        console.error("获取领导数据失败:", error);
      }
    },
    // 设置关注我的人数据
    setUserFollowers(userFollowers: UserFollowerItem[]) {
      this.userFollowers = userFollowers;
    },
    // 获取关注我的人数据
    async fetchUserFollowers() {
      try {
        const response = await queryUserFollower({ userId: "123456" });
        // 转换数据类型，添加缺失的 leaderSort 字段
        const userFollowers = response.data.map((item: UserFollowerData) => ({
          userId: item.userId,
          userName: item.userName,
          imgUrl: item.avatarUrl,
          leaderSort: 0, // 默认值
        }));
        this.setUserFollowers(userFollowers);
      } catch (error) {
        console.error("获取关注我的人数据失败:", error);
      }
    },
    // 设置关注我的人数据
    setLeaderFollowers(leaderFollowers: LeaderFollowerItem[]) {
      this.leadersIFollow = leaderFollowers;
    },
    // 获取关注我的人数据
    async fetchLeaderFollowers() {
      try {
        const response = await queryAttention({ userId: "123456" });
        // 转换数据类型
        const leaderFollowers = response.data.map(
          (item: QueryAttentionData) => ({
            followUserId: item.followUserId,
            followUserName: item.followUserName,
            imgUrl: item.avatarUrl,
          })
        );
        this.setLeaderFollowers(leaderFollowers);
      } catch (error) {
        console.error("获取领导关注的人数据失败:", error);
      }
    },
    setWhoFollowLeader(whoFollowLeader: UserFollowerItem[]) {
      this.whoFollowLeader = whoFollowLeader;
    },
    // 获取关注领导的人
    async fetchWhoFollowLeader() {
      try {
        const response = await queryUserFollower({ userId: "123456" });
        // 转换数据类型，添加缺失的 leaderSort 字段
        const whoFollowLeader = response.data.map((item: UserFollowerData) => ({
          userId: item.userId,
          userName: item.userName,
          imgUrl: item.avatarUrl,
          leaderSort: 0, // 默认值
        }));
        this.setWhoFollowLeader(whoFollowLeader);
      } catch (error) {
        console.error("获取领导关注的人数据失败:", error);
      }
    },
  },
});
