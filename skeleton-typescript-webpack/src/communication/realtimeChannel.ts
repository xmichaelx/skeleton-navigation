import {ObservatoryConfiguration} from '../domain/observatory';
import {Message,ObservingProgram} from '../domain/common';
import {Configuration} from '../domain/workarounds';
import "signalr";

export interface IDisposable {
    dispose(): void
}

export interface IRealtimeChannel {
    address: string;
    setAccessToken(token: string): void
    initialize(): Promise<void>

    // global
    getConfigurations(): Promise<Array<ObservatoryConfiguration>>
    getConfiguration(observatoryId: string): Promise<ObservatoryConfiguration>
    sendCommand(observatoryId: string, commandName: string, args?: any): Promise<string>

    // component
    addListenerForAllComponents(observatoryId: string, callback: (message: Message) => void): IDisposable
    addListenerForComponent(observatoryId: string, componentId: string, messageType: string, callback: (message: Message) => void): Promise<IDisposable>
    sendComponentCommand(observatoryId: string, componentId: string, commandName: string, args?: any): Promise<string>

    // schedule
    addListenerForScheduler(observatoryId: string, callback: (message: Message) => void): Promise<IDisposable>
    clear(observatoryId: string): Promise<string>
    submitSchedule(observatoryId: string, schedule: ObservingProgram, delayInMinutes: number): Promise<string>
}

export class RealtimeChannel implements IRealtimeChannel {
    private static reconnectionDelay = 10000;
    private connection: SignalR.Hub.Connection;
    private relayProxy: SignalR.Hub.Proxy;
    private plannerProxy: SignalR.Hub.Proxy;
    private token: string;

    private subscriptions: Map<string, number>;
    private configurations: Map<string, ObservatoryConfiguration>;

    constructor(public address: string) {
        this.configurations = new Map<string, ObservatoryConfiguration>();
        this.subscriptions = new Map<string, number>();

        this.connection = $.hubConnection(address);

        this.connection.error(error => {
            console.error(error);
        });

        this.connection.disconnected(() => {
            this.reconnection();
        })

        this.relayProxy = this.connection.createHubProxy("relayHub");
        this.plannerProxy = this.connection.createHubProxy("schedulerHub");
    }

    private reconnection() {
        console.warn(`Disconnected from relay. Retry after ${RealtimeChannel.reconnectionDelay} ms`);
        setTimeout(() => {
            this.initialize().then(() => {
                console.log("Connected - resubscribing");
                this.resubscribe();
            }, err => {
                this.reconnection();
            });
        }, RealtimeChannel.reconnectionDelay);
    }


    private resubscribe() {
        this.subscriptions.forEach((x, index) => {
            var tokens = index.split(":");
            if (tokens[1] === "schedule") {
                this.plannerProxy.invoke('subscribe', tokens[0]);
            } else {
                this.relayProxy.invoke('subscribe', tokens[0], tokens[1]);
            }
        });
    }

    public setAccessToken(token: string) {
        this.token = token;
        this.connection.qs = { 'token': token };
    }

    public initialize() {
        return new Promise<void>((resolve, reject) => {
            this.connection.start().done(() => {
                resolve();
            }).fail(() => {
                reject();
            });
        });
    }

    public getConfigurations() {
        return new Promise<Array<ObservatoryConfiguration>>((resolve, reject) => {
            this.relayProxy.invoke('getConfigurations').done((configurations) => {
                var cc = new Array<ObservatoryConfiguration>();
                for (var key in configurations) {
                    if (!configurations.hasOwnProperty(key)) continue;

                    cc.push(configurations[key].Value);
                }
                resolve(cc);
            }).fail(() => {
                reject();
            });
        });
    }

    public getConfiguration(observatoryId: string) {
        return new Promise<ObservatoryConfiguration>((resolve, reject) => {
            if (!this.configurations.has(observatoryId)) {
                this.relayProxy.invoke('getConfiguration', observatoryId).done(configuration => {
                    var conf = Configuration(configuration);
                    this.configurations.set(observatoryId, conf);
                    resolve(conf);
                }).fail(error => {
                    reject(error);
                });
            } else {
                var conf = Configuration(this.configurations.get(observatoryId));
                resolve(conf);
            }
        });
    }

    public addListenerForComponent(observatoryId: string, componentId: string, messageType: string, callback: (message: Message) => void) {
        return this.subscribeComponent(observatoryId, componentId).then(() => {
            var outerCallback = (message: Message) => {
                if ((message.observatoryId == observatoryId) && (message.componentId == componentId) && (message.type == messageType)) {
                    callback(message);
                }
            };

            this.relayProxy.on('onMessage', outerCallback);


            return {
                dispose: () => {
                    this.unsubscribeComponent(observatoryId, componentId).then(() => {
                        this.relayProxy.off('onMessage', outerCallback);
                    });
                }
            };
        });

    }

    public addListenerForAllComponents(observatoryId: string, callback: (message: Message) => void) {
        var outerCallback = (message: Message) => {
            if (message.observatoryId == observatoryId) {
                callback(message);
            }
        };

        this.relayProxy.on('onMessage', outerCallback);

        return {
            dispose: () => {
                this.relayProxy.off('onMessage', outerCallback);
            }
        };
    }

    public sendComponentCommand(observatoryId: string, componentId: string, commandName: string, args: any = null) {
        return new Promise<string>((resolve, reject) => {
            this.relayProxy.invoke('execute', observatoryId, componentId, commandName, JSON.stringify(args))
                .done(guid => {
                    resolve(guid);
                }).fail(error => {
                    reject(error);
                });
        });
    }

    public sendCommand(observatoryId: string, commandName: string) {
        return new Promise<string>((resolve, reject) => {
            this.relayProxy.invoke(commandName, observatoryId)
                .done(() => {
                    resolve();
                }).fail(error => {
                    reject(error);
                });
        });
    }

    public addListenerForScheduler(observatoryId: string, callback: (message: Message) => void) {
        return this.subscribeSchedule(observatoryId).then(() => {
            var outerCallback = (message: Message) => {
              console.log(message);
                if (
                    (message.componentId == "scheduler")
                    && (message.type == "observing atom" || message.type == "command result")) {
                    callback(message);
                }
            };

            this.plannerProxy.on('onMessage', outerCallback);

            return {
                dispose: () => {
                    this.unsubscribeSchedule(observatoryId).then(() => {
                        this.plannerProxy.off('onMessage', outerCallback);
                    });
                }
            };
        });
    }

    public clear(observatoryId: string) {
        return new Promise<string>((resolve, reject) => {
            this.plannerProxy.invoke('clear', observatoryId).done(guid => {
                resolve(guid);
            }).fail(error => {
                reject(error);
            });
        });
    }

    public submitSchedule(observatoryId: string, schedule: ObservingProgram, delayInMinutes: number) {
        return new Promise<string>((resolve, reject) => {
            this.plannerProxy.invoke('submitSchedule', observatoryId, schedule, delayInMinutes).done(guid => {
                resolve(guid);
            }).fail(error => {
                reject(error);
            });
        });
    }

    private subscribeComponent(observatoryId: string, componentId: string) {
        return new Promise<void>((resolve, reject) => {
            var subscriptionName = RealtimeChannel.createSubscriptionName(observatoryId, componentId);

            if (this.subscriptions.has(subscriptionName)) {
                this.subscriptions.set(subscriptionName, this.subscriptions.get(subscriptionName) + 1);
                resolve();
            }
            else {
                this.relayProxy.invoke('subscribe', observatoryId, componentId).done(() => {
                    this.subscriptions.set(subscriptionName, 1);
                    resolve();
                }).fail(error => {
                    reject(error);
                });
            }
        });
    }

    private unsubscribeComponent(observatoryId: string, componentId: string) {
        return new Promise<void>((resolve, reject) => {
            var subscriptionName = RealtimeChannel.createSubscriptionName(observatoryId, componentId);

            if (this.subscriptions.has(subscriptionName) && this.subscriptions.get(subscriptionName) > 1) {
                this.subscriptions.set(subscriptionName, this.subscriptions.get(subscriptionName) - 1);
                resolve();
            }
            else if (this.subscriptions.has(subscriptionName) && this.subscriptions.get(subscriptionName) == 1) {
                this.relayProxy.invoke('unsubscribe', observatoryId, componentId).done(() => {
                    this.subscriptions.delete(subscriptionName);
                    resolve();
                }).fail(error => {
                    reject(error);
                });
            }
            else {
                resolve();
            }
        });
    }

    private subscribeSchedule(observatoryId: string) {
        return new Promise<void>((resolve, reject) => {
            var subscriptionName = RealtimeChannel.createSubscriptionName(observatoryId, "schedule");

            if (this.subscriptions.has(subscriptionName)) {
                this.subscriptions.set(subscriptionName, this.subscriptions.get(subscriptionName) + 1);
                resolve();
            }
            else {
                this.plannerProxy.invoke('subscribe', observatoryId).done(() => {
                    this.subscriptions.set(subscriptionName, 1);
                    resolve();
                }).fail(error => {
                    reject(error);
                });
            }
        });
    }

    private unsubscribeSchedule(observatoryId: string) {
        return new Promise<void>((resolve, reject) => {
            var subscriptionName = RealtimeChannel.createSubscriptionName(observatoryId, "schedule");

            if (this.subscriptions.has(subscriptionName) && this.subscriptions.get(subscriptionName) > 1) {
                this.subscriptions.set(subscriptionName, this.subscriptions.get(subscriptionName) - 1);
                resolve();
            }
            else if (this.subscriptions.has(subscriptionName) && this.subscriptions.get(subscriptionName) == 1) {
                this.plannerProxy.invoke('unsubscribe', observatoryId).done(() => {
                    this.subscriptions.delete(subscriptionName);
                    resolve();
                }).fail(error => {
                    reject(error);
                });
            }
            else {
                resolve();
            }
        });
    }
    
    private static createSubscriptionName(observatoryId: string, componentId: string) {
        return `${observatoryId}:${componentId}`;
    }
}
