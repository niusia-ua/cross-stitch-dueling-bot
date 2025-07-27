import { UsersApi } from "~/api/";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);
  const settings = ref<UserSettings | null>(null);

  const isAuthenticated = computed(() => user.value !== null && settings.value !== null);

  function setUser(userData: User, settingsData: UserSettings) {
    user.value = userData;
    settings.value = settingsData;
  }

  async function fetchUser(userId: number) {
    const data = await UsersApi.getUser(userId);
    if (data) setUser(data.user, data.settings);
    return data;
  }

  async function registerUser(userData: UserData, settings: UserSettingsData) {
    const data = await UsersApi.createUser(userData, settings);
    setUser(data.user, data.settings);
    return data;
  }

  return { user, settings, isAuthenticated, setUser, fetchUser, registerUser };
});
