import type { UsersRepository } from "~~/server/repositories/";

interface Dependencies {
  usersRepository: UsersRepository;
}

export class UsersService {
  #usersRepository: UsersRepository;

  constructor({ usersRepository }: Dependencies) {
    this.#usersRepository = usersRepository;
  }

  async createUser(user: UserData, settings: UserSettingsData) {
    return await this.#usersRepository.createUser(user, settings);
  }

  async getUserWithSettings(userId: number) {
    const user = await this.#usersRepository.getUser(userId);
    if (!user) return null;

    const settings = await this.#usersRepository.getUserSettings(userId);
    if (!settings) return null;

    return { user, settings };
  }

  async updateUser(id: number, data: Omit<UserData, "id">) {
    return await this.#usersRepository.updateUser(id, data);
  }

  async updateUserSettings(id: number, data: UserSettingsData) {
    return await this.#usersRepository.updateUserSettings(id, data);
  }
}
