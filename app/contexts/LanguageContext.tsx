'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the available languages
export type Language = 'zh' | 'en';

// Define the context type
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  zh: {
    // Page titles
    'page.title': '咨询预约',
    'main.title': '叶乐律师',
    'admin.title': '管理员仪表盘',
    'admin.login.title': '管理员登录',
    'cancel.title': '取消预约',

    // Form labels
    'form.name': '姓名 *',
    'form.email': '电子邮箱 *',
    'form.wechatId': '微信号 *',
    'form.topic': '咨询主题 *',
    'form.date': '选择日期：',
    'form.password': '密码 *',

    // Buttons
    'button.admin': '管理员',
    'button.book': '预约',
    'button.cancel': '取消',
    'button.confirm': '确认',
    'button.processing': '处理中...',
    'button.login': '登录',
    'button.logout': '退出登录',
    'button.back': '返回',
    'button.save': '保存',
    'button.delete': '删除',
    'button.close': '关闭',
    'button.refresh': '刷新',
    'message.saved': '已保存',
    'message.alreadySaved': '预约已保存',

    // Booking confirmation
    'booking.confirmTitle': '确认预约',
    'booking.confirmMessage': '请确认以下预约信息是否正确：',
    'booking.appointmentDetails': '预约详情',
    'booking.timeNewYork': '纽约时间',
    'booking.timeLocal': '本地时间',
    'booking.timeShanghai': '上海时间',

    // Messages
    'message.loading': '正在加载可用时间段...',
    'message.noSlots': '该日期没有可用的时间段。请选择其他日期。',
    'message.bookingSuccess': '预约成功！确认邮件将发送至',
    'message.slotTaken': '该时间段刚刚被其他人预约。它已从可用时间段中移除。',
    'message.bookingFailed': '预约失败。请重试。',
    'message.loginFailed': '登录失败。请检查您的用户名和密码。',
    'message.cancelSuccess': '预约已成功取消。',
    'message.cancelFailed': '取消预约失败。请重试。',
    'message.updateSuccess': '预约更新成功！',
    'message.updateFailed': '更新预约失败。请重试。',
    'message.deleteSuccess': '预约已成功删除。',
    'message.deleteFailed': '删除预约失败。请重试。',
    'message.errorOccurred': '发生错误。请重试。',
    'message.allFieldsRequired': '所有字段都是必填的。',
    'message.invalidSlot': '无效的时间段。',
    'message.pastAppointment': '不能预约过去的时间。',
    'message.cannotSaveDeleted': '无法保存已删除的预约。',
    'message.alreadyDeleted': '预约已被删除',
    'message.deleted': '已删除',

    // Time zone info
    'timezone.info': '所有预约时间均为美国东部时间（EST - 纽约时间）。显示的时间已根据您的本地时区进行调整。',
    'timezone.shanghai': '对于上海用户（GMT+8）：橙色标记的时间段在上海时间是次日凌晨。',
    'timezone.nextDay': '次日',

    // Admin dashboard
    'admin.allAppointments': '所有预约',
    'admin.todayAppointments': '今天的预约',
    'admin.tomorrowAppointments': '明天的预约',
    'admin.viewAll': '全部',
    'admin.viewDay': '当天',
    'admin.noAppointments': '没有找到预约',
    'admin.timeSlots': '时间段',
    'admin.noTimeSlots': '没有可用的时间段',
    'admin.status.upcoming': '即将到来',
    'admin.status.completed': '已完成',
    'admin.status.today': '今天',
    'admin.status.past': '过去的',
    'admin.table.date': '日期和时间',
    'admin.table.name': '姓名',
    'admin.table.contact': '联系方式',
    'admin.table.wechatId': '微信号',
    'admin.table.topic': '主题',
    'admin.table.status': '到期',

    // System Maintenance
    'admin.settings.title': '系统维护',
    'admin.settings.attorneyName': '律师姓名',
    'admin.settings.attorneyNameEn': '英文姓名',
    'admin.settings.attorneyNameZh': '中文姓名',
    'admin.settings.titleStyle': '标题样式',
    'admin.settings.fontFamily': '字体',
    'admin.settings.fontSize': '字体大小',
    'admin.settings.color': '颜色',
    'admin.settings.preview': '预览',
    'admin.settings.background': '背景',
    'admin.settings.backgroundType': '背景类型',
    'admin.settings.backgroundColor': '背景颜色',
    'admin.settings.backgroundImage': '背景图片',
    'admin.settings.colorValue': '颜色值',
    'admin.settings.imageUrl': '图片链接',
    'admin.settings.backgroundPreview': '背景预览',
    'admin.settings.emailSettings': '邮件设置',
    'admin.settings.bccEmails': '密送邮件地址',
    'admin.settings.bccEmailsHelp': '多个邮件地址请用逗号分隔',
    'admin.settings.adminEmail': '管理员邮箱',
    'admin.settings.adminEmailHelp': '用于接收系统通知和警报的邮箱地址',
    'admin.settings.csvViewer': '预约数据查看器',
    'admin.settings.viewBookings': '查看预约数据',
    'admin.settings.loading': '加载中...',
    'admin.settings.bookingsData': '预约数据',
    'admin.settings.records': '条记录',
    'admin.settings.loadingData': '正在加载数据...',
    'admin.settings.noData': '没有可用的数据',
    'admin.settings.save': '保存',
    'admin.settings.saving': '保存中...',
    'admin.settings.reset': '重置',
    'admin.settings.saveSuccess': '设置已保存',
    'admin.settings.saveError': '保存设置时出错',
    'admin.settings.resetSuccess': '设置已重置',
    'admin.tabs.dashboard': '仪表盘',
    'admin.tabs.maintenance': '系统维护',
    'admin.tabs.health': '系统状态',
    'admin.slot.expired': '(过期)',
    'admin.legend': '图例',
    'admin.hasBookings': '已预约',
    'admin.available': '可预约',
    'admin.selectedDay': '已选择',
    'admin.weekend': '周末',
    'admin.appointments': '预约',
    'admin.modal.editAppointment': '编辑预约',
    'admin.modal.createAppointment': '创建预约',

    // Cancel page
    'cancel.confirm': '确认取消',
    'cancel.reason': '取消原因（可选）',
    'cancel.info': '您即将取消以下预约：',

    // Health Check
    'admin.health.title': '系统状态检查',
    'admin.health.refresh': '刷新',
    'admin.health.refreshing': '刷新中...',
    'admin.health.overallStatus': '总体状态',
    'admin.health.healthy': '健康',
    'admin.health.unhealthy': '不健康',
    'admin.health.version': '版本',
    'admin.health.environment': '环境',
    'admin.health.timestamp': '时间戳',
    'admin.health.componentStatus': '组件状态',
    'admin.health.component': '组件',
    'admin.health.status': '状态',
    'admin.health.message': '消息',
    'admin.health.components.database': '数据库',
    'admin.health.components.email': '电子邮件',
    'admin.health.components.filesystem': '文件系统',
    'admin.health.components.memory': '内存',
    'admin.health.systemInfo': '系统信息',
    'admin.health.componentDetails': '组件详情',
    'admin.health.platform': '平台',
    'admin.health.nodeVersion': 'Node版本',
    'admin.health.uptime': '运行时间',
    'admin.health.hostname': '主机名',
    'admin.health.cpus': 'CPU数量',
    'admin.health.memory': '内存',
    'admin.health.totalMemory': '总内存',
    'admin.health.freeMemory': '可用内存',
    'admin.health.usedMemory': '已用内存',
    'admin.health.memoryUsage': '内存使用率',
    'admin.health.lastChecked': '最后检查时间',

    // Language
    'language': '语言',
    'language.zh': '中文',
    'language.en': '英文'
  },
  en: {
    // Page titles
    'page.title': 'Appointment Booking',
    'main.title': 'Attorney Ye Le',
    'admin.title': 'Admin Dashboard',
    'admin.login.title': 'Admin Login',
    'cancel.title': 'Cancel Appointment',

    // Form labels
    'form.name': 'Name *',
    'form.email': 'Email *',
    'form.wechatId': 'WeChat ID *',
    'form.topic': 'Consulting Topic *',
    'form.date': 'Select Date:',
    'form.password': 'Password *',

    // Buttons
    'button.admin': 'Admin',
    'button.book': 'Book',
    'button.cancel': 'Cancel',
    'button.confirm': 'Confirm',
    'button.processing': 'Processing...',
    'button.login': 'Login',
    'button.logout': 'Logout',
    'button.back': 'Back',
    'button.save': 'Save',
    'button.delete': 'Delete',
    'button.close': 'Close',
    'button.refresh': 'Refresh',
    'message.saved': 'Saved',
    'message.alreadySaved': 'Appointment already saved',

    // Booking confirmation
    'booking.confirmTitle': 'Confirm Appointment',
    'booking.confirmMessage': 'Please confirm the following appointment details:',
    'booking.appointmentDetails': 'Appointment Details',
    'booking.timeNewYork': 'New York Time',
    'booking.timeLocal': 'Local Time',
    'booking.timeShanghai': 'Shanghai Time',

    // Messages
    'message.loading': 'Loading available time slots...',
    'message.noSlots': 'No available time slots for this date. Please select another date.',
    'message.bookingSuccess': 'Booking successful! A confirmation email will be sent to',
    'message.slotTaken': 'This time slot was just booked by someone else. It has been removed from available slots.',
    'message.bookingFailed': 'Booking failed. Please try again.',
    'message.loginFailed': 'Login failed. Please check your username and password.',
    'message.cancelSuccess': 'Appointment has been successfully cancelled.',
    'message.cancelFailed': 'Failed to cancel appointment. Please try again.',
    'message.updateSuccess': 'Appointment updated successfully!',
    'message.updateFailed': 'Failed to update appointment. Please try again.',
    'message.deleteSuccess': 'Appointment has been successfully deleted.',
    'message.deleteFailed': 'Failed to delete appointment. Please try again.',
    'message.errorOccurred': 'An error occurred. Please try again.',
    'message.allFieldsRequired': 'All fields are required.',
    'message.invalidSlot': 'Invalid time slot.',
    'message.pastAppointment': 'Cannot book appointments in the past.',
    'message.cannotSaveDeleted': 'Cannot save a deleted appointment.',
    'message.alreadyDeleted': 'Appointment has been deleted',
    'message.deleted': 'Deleted',

    // Time zone info
    'timezone.info': 'All appointment times are in Eastern Time (EST - New York Time). The displayed times have been adjusted based on your local time zone.',
    'timezone.shanghai': 'For users in Shanghai (GMT+8): Time slots marked in orange will be after midnight in Shanghai time.',
    'timezone.nextDay': 'Next day',

    // Admin dashboard
    'admin.allAppointments': 'All Appointments',
    'admin.todayAppointments': 'Today\'s Appointments',
    'admin.tomorrowAppointments': 'Tomorrow\'s Appointments',
    'admin.viewAll': 'All',
    'admin.viewDay': 'Today',
    'admin.noAppointments': 'No appointments found',
    'admin.timeSlots': 'Time Slots',
    'admin.noTimeSlots': 'No time slots available',
    'admin.status.upcoming': 'Upcoming',
    'admin.status.completed': 'Completed',
    'admin.status.today': 'Today',
    'admin.status.past': 'Past',
    'admin.table.date': 'Date & Time',
    'admin.table.name': 'Name',
    'admin.table.contact': 'Contact',
    'admin.table.wechatId': 'WeChat ID',
    'admin.table.topic': 'Topic',
    'admin.table.status': 'Due',

    // System Maintenance
    'admin.settings.title': 'System Maintenance',
    'admin.settings.attorneyName': 'Attorney Name',
    'admin.settings.attorneyNameEn': 'English Name',
    'admin.settings.attorneyNameZh': 'Chinese Name',
    'admin.settings.titleStyle': 'Title Style',
    'admin.settings.fontFamily': 'Font Family',
    'admin.settings.fontSize': 'Font Size',
    'admin.settings.color': 'Color',
    'admin.settings.preview': 'Preview',
    'admin.settings.background': 'Background',
    'admin.settings.backgroundType': 'Background Type',
    'admin.settings.backgroundColor': 'Background Color',
    'admin.settings.backgroundImage': 'Background Image',
    'admin.settings.colorValue': 'Color Value',
    'admin.settings.imageUrl': 'Image URL',
    'admin.settings.backgroundPreview': 'Background Preview',
    'admin.settings.emailSettings': 'Email Settings',
    'admin.settings.bccEmails': 'BCC Email Addresses',
    'admin.settings.bccEmailsHelp': 'Separate multiple email addresses with commas',
    'admin.settings.adminEmail': 'Admin Email Address',
    'admin.settings.adminEmailHelp': 'Email address to receive system notifications and alerts',
    'admin.settings.csvViewer': 'Bookings Data Viewer',
    'admin.settings.viewBookings': 'View Bookings Data',
    'admin.settings.loading': 'Loading...',
    'admin.settings.bookingsData': 'Bookings Data',
    'admin.settings.records': 'records',
    'admin.settings.loadingData': 'Loading data...',
    'admin.settings.noData': 'No data available',
    'admin.settings.save': 'Save',
    'admin.settings.saving': 'Saving...',
    'admin.settings.reset': 'Reset',
    'admin.settings.saveSuccess': 'Settings saved successfully',
    'admin.settings.saveError': 'Error saving settings',
    'admin.settings.resetSuccess': 'Settings reset to default',
    'admin.tabs.dashboard': 'Dashboard',
    'admin.tabs.maintenance': 'System Maintenance',
    'admin.tabs.health': 'Health Check',
    'admin.slot.expired': '(Expired)',
    'admin.legend': 'Legend',
    'admin.hasBookings': 'Booked',
    'admin.available': 'Available',
    'admin.selectedDay': 'Selected',
    'admin.weekend': 'Weekend',
    'admin.appointments': 'Appointments',
    'admin.modal.editAppointment': 'Edit Appointment',
    'admin.modal.createAppointment': 'Create Appointment',

    // Cancel page
    'cancel.confirm': 'Confirm Cancellation',
    'cancel.reason': 'Reason for cancellation (optional)',
    'cancel.info': 'You are about to cancel the following appointment:',

    // Health Check
    'admin.health.title': 'System Health Check',
    'admin.health.refresh': 'Refresh',
    'admin.health.refreshing': 'Refreshing...',
    'admin.health.overallStatus': 'Overall Status',
    'admin.health.healthy': 'Healthy',
    'admin.health.unhealthy': 'Unhealthy',
    'admin.health.version': 'Version',
    'admin.health.environment': 'Environment',
    'admin.health.timestamp': 'Timestamp',
    'admin.health.componentStatus': 'Component Status',
    'admin.health.component': 'Component',
    'admin.health.status': 'Status',
    'admin.health.message': 'Message',
    'admin.health.components.database': 'Database',
    'admin.health.components.email': 'Email',
    'admin.health.components.filesystem': 'Filesystem',
    'admin.health.components.memory': 'Memory',
    'admin.health.systemInfo': 'System Information',
    'admin.health.componentDetails': 'Component Details',
    'admin.health.platform': 'Platform',
    'admin.health.nodeVersion': 'Node Version',
    'admin.health.uptime': 'Uptime',
    'admin.health.hostname': 'Hostname',
    'admin.health.cpus': 'CPU Cores',
    'admin.health.memory': 'Memory',
    'admin.health.totalMemory': 'Total Memory',
    'admin.health.freeMemory': 'Free Memory',
    'admin.health.usedMemory': 'Used Memory',
    'admin.health.memoryUsage': 'Memory Usage',
    'admin.health.lastChecked': 'Last Checked',

    // Language
    'language': 'Language',
    'language.zh': 'Chinese',
    'language.en': 'English'
  }
};

// Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Chinese
  const [language, setLanguageState] = useState<Language>('zh');

  // Load language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
