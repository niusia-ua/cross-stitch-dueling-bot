import { AuthApi, UsersApi } from "~/api/";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);
  const settings = ref<UserSettings | null>(null);

  const isAuthenticated = computed(() => user.value !== null && settings.value !== null);

  function setUser(userData: User, settingsData: UserSettings) {
    user.value = userData;
    settings.value = settingsData;
  }

  async function authenticateUser(initData: string) {
    const data = await AuthApi.auth(initData);
    setUser(data.user, data.settings);
    return data;
  }

  async function registerUser(userData: UserData, settings: UserSettingsData) {
    const data = await UsersApi.createUser(userData, settings);
    setUser(data.user, data.settings);
    return data;
  }

  async function updateUser(userData: Omit<UserData, "id">) {
    user.value = await UsersApi.updateUser(user.value!.id, userData);
    return user.value;
  }

  async function updateUserSettings(settingsData: UserSettingsData) {
    settings.value = await UsersApi.updateUserSettings(user.value!.id, settingsData);
    return settings.value;
  }

  return { user, settings, isAuthenticated, setUser, authenticateUser, registerUser, updateUser, updateUserSettings };
});
