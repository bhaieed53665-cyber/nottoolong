const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID; // آيدي السيرفر
const APPLICATIONS_CHANNEL_ID = process.env.APPLICATIONS_CHANNEL_ID; // الشات الي بتجيه التقديمات

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ====== تسجيل الأمر ======
const commands = [
  new SlashCommandBuilder()
    .setName('eventsapplication')
    .setDescription('تقديم على الفعاليات')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // الإدارة بس ترسل اللوحة
    .toJSON(),
];

client.once('clientReady', async () => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
    body: commands,
  });
  console.log(`✅ البوت شغال: ${client.user.tag}`);
});

// ====== التفاعلات ======
client.on('interactionCreate', async (interaction) => {
  try {
    // 1) الأمر /eventsapplication -> يرسل اللوحة
    if (interaction.isChatInputCommand() && interaction.commandName === 'eventsapplication') {
      const embed = new EmbedBuilder()
        .setTitle('التقديم على رتبة صانع محتوى')
        .setDescription(
          [
            '# شروط صانعي المحتوى في حفل ميلاد',
            '- ممنوع أن يكون على العضو أي شكوى سابقة',
            '- يجب ان يكون نسبة كبيرة من محتواك متعلقه بـ حفل ميلاد',
            '- المحتوى في روم المحتوى مراقب من قبل الإدارة وأي مخالفة ستسحب الرتبة مباشرة',
          ].join('\n')
        )
        .setColor(0x5865f2);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('apply_creator')
          .setLabel('تقديم')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    // 2) زر التقديم -> يفتح القائمة (Modal)
    if (interaction.isButton() && interaction.customId === 'apply_creator') {
      const modal = new ModalBuilder()
        .setCustomId('creator_modal')
        .setTitle('التقديم على صانع محتوى');

      const input = (id, label, placeholder) =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setPlaceholder(placeholder)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
        );

      modal.addComponents(
        input('platform', 'ماهي المنصة التي تستعملها', 'تيك توك / يوتيوب / انستجرام ...'),
        input('username', 'يوزرك بالمنصة التي تستعملها', '@username'),
        input('views', 'عدد المشاهدات على المقطع الواحد بالعادة', 'مثال: 5000'),
        input('followers', 'عدد المتابعين', 'مثال: 10000'),
        input('type', 'نوع المحتوى الذي تقدمه', 'فكاهي / تعليمي / عشوائيات ...')
      );

      await interaction.showModal(modal);
      return;
    }

    // 3) بعد ما يكبس Submit -> يرسل التقديم للشات المحدد
    if (interaction.isModalSubmit() && interaction.customId === 'creator_modal') {
      const get = (id) => interaction.fields.getTextInputValue(id);

      const embed = new EmbedBuilder()
        .setTitle('📥 تقديم جديد - صانع محتوى')
        .setColor(0x57f287)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: 'المنصة', value: get('platform') },
          { name: 'اليوزر بالمنصة', value: get('username') },
          { name: 'عدد المشاهدات على المقطع الواحد', value: get('views') },
          { name: 'عدد المتابعين', value: get('followers') },
          { name: 'نوع المحتوى', value: get('type') }
        )
        .setFooter({ text: `ID: ${interaction.user.id}` })
        .setTimestamp();

      const channel = await client.channels.fetch(APPLICATIONS_CHANNEL_ID);
      await channel.send({
        content: `تقديم من ${interaction.user}`, // منشن للحساب
        embeds: [embed],
      });

      await interaction.reply({
        content: '✅ تم إرسال تقديمك بنجاح، انتظر رد الإدارة.',
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      interaction.reply({ content: '❌ صار خطأ، حاول مرة ثانية.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

client.login(TOKEN);
