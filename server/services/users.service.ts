import type { UsersRepository } from "~~/server/repositories/";

interface Dependencies {
  usersRepository: UsersRepository;
}

export class UsersService {
  #usersRepository: UsersRepository;

  constructor({ usersRepository }: Dependencies) {
    this.#usersRepository = usersRepository;
  }

  async createUser(id: number, user: Omit<UserData, "active">, settings: UserSettingsData) {
    return await this.#usersRepository.createUser(id, user, settings);
  }

  async getUserIdAndFullname(userId: number) {
    return await this.#usersRepository.getUserIdAndFullname(userId);
  }

  async getUserAndSettings(userId: number) {
    return await this.#usersRepository.getUserAndSettings(userId);
  }

  async updateUser(id: number, data: Partial<UserData>) {
    return await this.#usersRepository.updateUser(id, data);
  }

  async updateUserSettings(id: number, data: Partial<UserSettingsData>) {
    return await this.#usersRepository.updateUserSettings(id, data);
  }
}
