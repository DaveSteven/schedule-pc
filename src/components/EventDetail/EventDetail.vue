<template>
  <div class="event-detail">
    <!-- 时间信息 -->
    <div class="event-detail__item">
      <div class="event-detail__label">
        <svg class="event-detail__icon" viewBox="0 0 24 24">
          <path
            d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"
          />
        </svg>
        时间
      </div>
      <div class="event-detail__value">
        <div>{{ formatEventDate(eventData?.start || "") }}</div>
        <div>
          {{ formatEventTime(eventData?.start || "", eventData?.end || "") }}
        </div>
      </div>
    </div>

    <!-- 发起人 -->
    <div v-if="eventData?.tuCname" class="event-detail__item">
      <div class="event-detail__label">
        <svg class="event-detail__icon" viewBox="0 0 24 24">
          <path
            d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
          />
        </svg>
        发起人
      </div>
      <div class="event-detail__value">
        {{ eventData.tuCname }}
      </div>
    </div>

    <!-- 地点 -->
    <div v-if="eventData?.roomName" class="event-detail__item">
      <div class="event-detail__label">
        <svg class="event-detail__icon" viewBox="0 0 24 24">
          <path
            d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"
          />
        </svg>
        地点
      </div>
      <div class="event-detail__value">
        {{ eventData.roomName }}
      </div>
    </div>

    <!-- 日程类型 -->
    <div v-if="eventData?.scheduleType" class="event-detail__item">
      <div class="event-detail__label">
        <svg class="event-detail__icon" viewBox="0 0 24 24">
          <path
            d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"
          />
        </svg>
        类型
      </div>
      <div class="event-detail__value">
        {{ getScheduleTypeText(eventData?.scheduleType) }}
      </div>
    </div>

    <!-- 提醒设置 -->
    <div v-if="eventData?.remindType" class="event-detail__item">
      <div class="event-detail__label">
        <svg class="event-detail__icon" viewBox="0 0 24 24">
          <path
            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
          />
        </svg>
        提醒
      </div>
      <div class="event-detail__value">
        {{ getRemindTypeText(eventData.remindType) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  formatEventDate,
  formatEventTime,
  getScheduleTypeText,
  getRemindTypeText,
} from "../EventPopover/utils";
import type { EventData } from "../EventPopover/types";

interface Props {
  eventData?: EventData | null;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.event-detail {
  &__item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    display: flex;
    align-items: center;
    min-width: 60px;
    color: #6b7280;
    font-size: 13px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  &__icon {
    width: 14px;
    height: 14px;
    margin-right: 6px;
    fill: currentColor;
    flex-shrink: 0;
  }

  &__value {
    color: #1f2937;
    font-size: 14px;
    line-height: 1.4;
    flex: 1;
  }
}
</style>
