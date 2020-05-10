# ts-command

ts-command is a very basic command library utilizing Typescript decorators.
It also supports reloading commands on the fly.

# Getting Started

_Note: you have to disable `strictFunctionTypes` in your `tsconfig` to be able to use the decorators better._

In your `tsconfig` set these compiler options:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

In the entry file, import `reflect-metadata` like this:

```ts
import 'reflect-metadata';
```

Now you should be good to go.

1. Create a `CommandManager`. This class will manage all the commands and services you register.

```ts
import { CommandManager } from 'ts-command';
const manager = new CommandManager();
```

2. Create a `CommandCollection`.

```ts
import { Command, Restrict, RestrictClass, Injectable } from 'ts-command';
// Set this to enable service injection
@Injectable()
// Restrict all commands in this class.
@RestrictClass((
  // the user (supplied by you)
  user: any,
  // the collection instance
  instance: MyCommandCollection,
) =>
  // check whether the user is valid
  instance.service.isValid(user),
)
class MyCommandCollection {
  // specify the injected services (these get injected for you)
  constructor(private service: AuthService) {}

  // Restrict the command
  @Restrict((user: any) => user.id > 5)
  // Specify the command name ('my-command') and arguments ('name')
  @Command('my-command', 'name')
  // execute the command. The first argument contains the command-arguments, the second the user
  myCommand({ name }: { name: string }, user: any) {
    return `Hello ${name}! -by ${user.name}`;
  }
}
```

3. Create a `Service`

```ts
import { Service } from 'ts-command';

@Service()
class AuthService {
  isValid(user: any) {
    return !!user.id;
  }
}
```

4. Register the service and command-collection

```ts
import { CommandManager } from 'ts-command';
// the command manager supports chaining
const manager: CommandManager = new CommandManager().registerService(AuthService).load(MyCommandCollection);
```

5. Run commands

The manager expects a string like this: `<command-name> [...args]`.
So you have to check whether it's a command (e.g. check for a prefix **and** remove the prefix).

```ts
const reply = await manager.onCommand(message, user);
```

# Reloading

Currently, reloading is an opt-in feature.
You can enable it by passing either `true` to the `CommandManager` or by passing reload-options:

```ts
// Enable for all users:
new CommandManager(true);

// Restrict reloading
new CommandManager({
  enabled: true,
  restrict: (user: any) => user.isAdmin,
});
```

This will add a `reload` command. The signature is: `reload <name: command or service>`.
