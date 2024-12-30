README.md dosyası Türkçe versiyonu v1

# Wrangler GitHub Action

[Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/) kullanmak için kolayca kullanılabilir GitHub Action. Workers'ı dağıtmayı çok kolay hale getirir.

## v3'te Büyük Değişiklikler

- Wrangler v1 artık desteklenmiyor.
- Global API anahtarı ve E-posta Kimlik Doğrulaması artık desteklenmiyor.
- Action sürüm sözdizimi artık destekleniyor. Bu, örneğin `uses: cloudflare/wrangler-action@v3`, `uses: cloudflare/wrangler-action@v3.x` ve `uses: cloudflare/wrangler-action@v3.x.x` gibi kullanımların artık geçerli olduğu anlamına gelir.

[Daha fazla bilgi için Değişiklik Günlüğüne bakın](CHANGELOG.md).

## Kullanım

Workers/Pages uygulamanız için `wrangler-action`'ı çalışma akışına ekleyin. Aşağıdaki örnek, `main` dalına bir `git push` yapıldığında bir Worker'ı dağıtacaktır:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Kimlik Doğrulama

GitHub'un Secrets özelliğini kullanarak Wrangler'ı yapılandırmanız gerekecek - "Ayarlar -> Secrets" bölümüne gidin ve Cloudflare API belirtecinizi ekleyin (bunu bulma konusunda yardım için [Workers dokümantasyonuna](https://developers.cloudflare.com/workers/cli-wrangler/) bakın).

API belirtecinizi depo için bir gizli bilgi olarak ayarladıktan sonra, çalışma akışınızın `with` bloğunda action'a geçirin. Aşağıda, gizli bilgi adını `CLOUDFLARE_API_TOKEN` olarak ayarladım:

```yaml
jobs:
  deploy:
    name: Deploy
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Yapılandırma

Dağıtım için kullanmak üzere Wrangler'ın belirli bir sürümünü yüklemeniz gerekiyorsa, NPM'den Wrangler'ın belirli bir sürümünü yüklemek için `wranglerVersion` girişini de geçebilirsiniz. Bu, bir SemVer olmalıdır.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        wranglerVersion: "2.20.0"
```

İsteğe bağlı olarak, action'a `workingDirectory` anahtarını da geçebilirsiniz. Bu, Wrangler komutunu çalıştırmak için depo içindeki bir alt dizini belirtmenize olanak tanır.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        workingDirectory: "subfoldername"
```

[Worker gizli bilgileri](https://developers.cloudflare.com/workers/tooling/wrangler/secrets/) isteğe bağlı olarak `secrets` olarak yeni satırlarla ayrılmış adlarla geçilebilir. Her gizli bilgi adı [...]

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        environment: production
        secrets: |
          SECRET1
          SECRET2
      env:
        SECRET1: ${{ secrets.SECRET1 }}
        SECRET2: ${{ secrets.SECRET2 }}
```

Ek komutları `deploy` öncesi veya sonrası çalıştırmanız gerekiyorsa, bunları `preCommands` (deploy öncesi) veya `postCommands` (deploy sonrası) olarak giriş olarak belirtebilirsiniz. Bu, ek adımlar içerebilir.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        preCommands: echo "*** pre command ***"
        postCommands: |
          echo "*** post commands ***"
          wrangler kv:key put --binding=MY_KV key2 value2
          echo "******"
```

Projenize karşı `wrangler whoami` komutunu çalıştırmak gibi belirli işlemleri yapmak için `command` seçeneğini kullanabilirsiniz:

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        command: whoami
```

Ayrıca, birden fazla satırı kapsayan bir komut ekleyebilirsiniz:

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        command: |
          pages project list
          pages deploy .vercel/output/static --project-name=demo-actions --branch=test
```

## Kullanım Senaryoları

### Ana dala commit'ler eklendiğinde dağıtım

Yukarıdaki çalışma akışı örnekleri, yeni commit'ler ana dala eklendiğinde `wrangler-action` çalıştırmanın nasıl yapılacağını zaten göstermiştir. Çoğu geliştirici için bu çalışma akışı manuel dağıtımların yerini kolayca alacaktır.

```yaml
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Bir çalışma akışını tetiklemek için kullanılabilecek bir dizi olası olay vardır. Kullanılabilir olaylar hakkında daha fazla bilgi için [GitHub Actions dokümantasyonuna](https://help.github.com) bakın.

### Pages sitenizi dağıtın (üretim ve önizleme)

Pages projenizi yerleşik sürekli entegrasyon (CI) yerine GitHub Actions ile dağıtmak istiyorsanız, bu harika bir yoldur. Wrangler 2, commit mesajını ve branşı dolduracaktır.

```yaml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy YOUR_DIST_FOLDER --project-name=example
          # İsteğe bağlı: GitHub Deployments tetiklemek istiyorsanız bu seçeneği etkinleştirin
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Bir program dahilinde dağıtma

Workers uygulamanızı belirli aralıklarla (örneğin her saat veya günlük) dağıtmak istiyorsanız, `schedule` tetikleyici, cron sözdizimini kullanarak bir çalışma akışı zamanlamanıza olanak tanır.

```yaml
on:
  schedule:
    - cron: "0 * * * *"

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      - name: Deploy app
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Doğru cron sözdizimini tanımlama konusunda yardıma ihtiyacınız varsa, cron zamanlamanızı doğrulamak için kullanıcı dostu bir arayüz sağlayan [crontab.guru](https://crontab.guru/) adresine göz atın.

### Dağıtımı manuel olarak tetikleme

Bir çalışma akışını istediğiniz zaman tetiklemeniz gerekiyorsa, çalışma akışınızda `workflow_dispatch` olayını kullanabilirsiniz.

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Dağıtılacak ortamı seçin: <dev|staging|prod>"
        required: true
        default: "dev"
jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      - name: Deploy app
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env ${{ github.event.inputs.environment }}
```

Daha gelişmiş kullanım veya scriptlerden programlı olarak çalışma akışını tetikleme için [GitHub dokümantasyonuna](https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event) bakın.

### Bir Worker Sürümü Yükleme

Worker'ınızın hemen dağıtılmayan yeni bir sürümünü oluşturmak için `wrangler versions upload` komutunu kullanın. Bu şekilde oluşturulan Worker sürümleri daha sonra toplu olarak dağıtılabilir.

```yaml
jobs:
  upload:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      - name: Upload Worker Version
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: versions upload
```

## Gelişmiş Kullanım

### Belirli bir ortam için bir Worker Gizli Bilgisi Ayarlama

Bu, çalışma akışınızda ayarlanabilecek bir ortam parametresidir. Örnek:

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy --env production
    secrets: |
      SUPER_SECRET
    environment: production
  env:
    SUPER_SECRET: ${{ secrets.SUPER_SECRET }}
```

### Sonraki Adımlarda Wrangler Komut Çıktısını Kullanma

Daha gelişmiş çalışma akışları, Wrangler komutlarının sonucunu ayrıştırmayı gerektirebilir. Bunu yapmak için, sonraki adımlarda `command-output` çıktı değişkenini kullanabilirsiniz. Örneğin:

```yaml
- name: Deploy
  id: deploy
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy --project-name=example

- name: print wrangler command output
  env:
    CMD_OUTPUT: ${{ steps.deploy.outputs.command-output }}
  run: echo $CMD_OUTPUT
```

Artık çalışma akışınızı çalıştırdığınızda, Wrangler komutunun tam çıktısını çalışma akışı günlüklerinizde göreceksiniz. Bu çıktıyı sonraki çalışma akışı adımlarında belirli çıktıları ayrıştırmak için de kullanabilirsiniz.

> Not: Wrangler komutunun standart hata çıktısını ayrıştırmanız gerekirse `command-stderr` çıktı değişkeni de mevcuttur.

### `deployment-url` ve `pages-deployment-alias-url` Çıktı Değişkenlerini Kullanma

Workers veya Pages dağıtımıyla sonuçlanan bir Wrangler komutunu çalıştırıyorsanız, dağıtımın URL'sini almak için `deployment-url` çıktı değişkenini kullanabilirsiniz. Örneğin:

```yaml
- name: Deploy
  id: deploy
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy --project-name=example

- name: print deployment-url
  env:
    DEPLOYMENT_URL: ${{ steps.deploy.outputs.deployment-url }}
  run: echo $DEPLOYMENT_URL
```

Sonuç olarak şuna benzer bir çıktı elde edeceksiniz:

```text
https://<your_pages_site>.pages.dev
```

Pages dağıtımları ayrıca alias URL'lerini de sağlar (Wrangler v3.78.0'dan beri). Dağıtım alias URL'sini almak için `pages-deployment-alias-url` çıktı değişkenini kullanabilirsiniz. Bu, başka bir dalı dağıtmak için kullanışlıdır.

Örneğin, yukarıdaki örnek action kullanılarak ana dal dışında bir dal dağıtıldıysa, dal URL'sini almak için aşağıdaki komutu kullanabilirsiniz:

```yaml
- name: print pages-deployment-alias-url
  env:
    DEPLOYMENT_ALIAS_URL: ${{ steps.deploy.outputs.pages-deployment-alias-url }}
  run: echo $DEPLOYMENT_ALIAS_URL
```

Sonuç olarak:

```text
https://new-feature.<your_pages_site>.pages.dev
```

### Farklı bir paket yöneticisi kullanma

Varsayılan olarak, bu action, bir `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` veya `bun.lockb`/`bun.lock` dosyasının varlığına bağlı olarak hangi paket yöneticisinin kullanılacağını algılar.

Uygulamanız için belirli bir paket yöneticisi kullanmanız gerekiyorsa, `packageManager` girdisini `npm`, `yarn`, `pnpm` veya `bun` olarak ayarlayabilirsiniz. Bu seçeneği yalnızca belirli bir paket yöneticisi kullanmak istiyorsanız ayarlamanız gerekir.

```yaml
jobs:
  deploy:
    steps:
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        packageManager: pnpm
```

## Sorun Giderme

### "Workers/Wrangler kullanmaya yeni başladım ve bunun ne olduğunu bilmiyorum!"

Başlamak için [Hızlı Başlangıç kılavuzuna](https://developers.cloudflare.com/workers/quickstart) bakın. Bir Workers uygulamanız olduğunda, bunu otomatik olarak dağıtılacak şekilde ayarlamak isteyebilirsiniz.

### "[ERROR] Hesap kimliği bulunamadı, çıkılıyor.."

`wrangler.toml` dosyanıza `account_id = ""` eklemeniz veya bu GitHub Action'da `accountId` ayarlamanız gerekecek.

```yaml
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      - name: Deploy app
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Bu çeviriyi GitHub deposundaki README.md dosyasına ekleyebilmek için, manuel olarak dosyayı düzenleyip çeviriyi eklemeniz gerekecek. GitHub üzerinden dosya düzenlemek için şu adımları izleyebilirsiniz:

1. Depoya gidin: [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action)
