/**
 * Enum having all the roles supported by the application
 */
class EventEnum {
    static KHITAB_E_SWAR_2025 = new EventEnum(1,'Singing');
    #value
    #category

    constructor(value,category) {
        this.#value = value
        this.#category = category
    }

    toString() {
        return this.#value
    }

    // Static method to convert string to enum
    static fromInt(value) {
        const allValues = [EventEnum.KHITAB_E_SWAR_2025];
        return allValues.find((role) => {
           return role.#value === value;
        });
    }
}

module.exports = EventEnum;
