/**
 * Enum having all the roles supported by the application
 */
class RoleEnum {
    static ADMIN = new RoleEnum(0);
    static MANAGER = new RoleEnum(1);
    static USER = new RoleEnum(2);
    #value

    constructor(value) {
        this.#value = value
    }

    toString() {
        return this.#value
    }

    // Static method to convert string to enum
    static fromInt(value) {
        const allValues = [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.USER];
        return allValues.find((role) => {
           return role.#value === value;
        });
    }
}

module.exports = RoleEnum;
