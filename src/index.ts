export type MyType = {
    isTest: boolean,
}

export function doMyTest(myType: MyType): void {
    console.log('Is test value: ', myType.isTest);
}