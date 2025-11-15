import type { UsersRepository } from "~~/server/repositories/";

interface Dependencies {
  usersRepository: UsersRepository;
}

/** User service for managing user-related operations. */
export class UsersService {
  #usersRepository: UsersRepository;

  constructor({ usersRepository }: Dependencies) {
    this.#usersRepository = usersRepository;
  }

  /** Retrieves all users with their settings. */
  async getAllUsersWithSettings() {
    return await this.#usersRepository.getAllUsersWithSettings();
  }

  /**
   * Creates a new user.
   * @param id The ID of the user.
   * @param user The user data.
   * @param settings The user settings.
   * @returns The created user and settings.
   */
  async createUser(id: number, user: Omit<UserData, "active">, settings: UserSettingsData) {
    return await this.#usersRepository.createUser(id, user, settings);
  }

  /**
   * Retrieves the user ID and fullname for a specific user.
   * @param userId The ID of the user.
   * @returns The user ID and fullname.
   */
  async getUserIdAndFullname(userId: number) {
    return await this.#usersRepository.getUserIdAndFullname(userId);
  }

  /**
   * Retrieves the user and settings for a specific user.
   * @param userId The ID of the user.
   * @returns The user and settings.
   */
  async getUserAndSettings(userId: number) {
    return await this.#usersRepository.getUserAndSettings(userId);
  }

  /**
   * Updates the user data for a specific user.
   * @param actorId The ID of the user making the request.
   * @param targetId The ID of the user to update.
   * @param data The new user data.
   * @returns The updated user data.
   */
  async updateUser(actorId: number, targetId: number, data: Partial<UserData>) {
    if (actorId !== targetId) {
      throw createApiError({
        code: ApiErrorCode.NotAllowed,
        message: "You are not allowed to update this user's data.",
      });
    }
    return await this.#usersRepository.updateUser(targetId, data);
  }

  /**
   * Updates the user settings for a specific user.
   * @param actorId The ID of the user making the request.
   * @param targetId The ID of the user to update.
   * @param data The new user settings data.
   * @returns The updated user settings data.
   */
  async updateUserSettings(actorId: number, targetId: number, data: Partial<UserSettingsData>) {
    if (actorId !== targetId) {
      throw createApiError({
        code: ApiErrorCode.NotAllowed,
        message: "You are not allowed to update this user's settings.",
      });
    }
    return await this.#usersRepository.updateUserSettings(targetId, data);
  }

  /** Retrieves the users eligible for weekly random duels. */
  async getUsersForWeeklyRandomDuels() {
    return await this.#usersRepository.getUsersForWeeklyRandomDuels();
  }
}
