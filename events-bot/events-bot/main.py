import os
import discord
from discord import app_commands

TOKEN = os.environ["TOKEN"]
GUILD_ID = int(os.environ["GUILD_ID"])  # آيدي السيرفر
APPLICATIONS_CHANNEL_ID = int(os.environ["APPLICATIONS_CHANNEL_ID"])  # الشات الي بتجيه التقديمات

GUILD = discord.Object(id=GUILD_ID)


# ====== القائمة (Modal) ======
class ApplyModal(discord.ui.Modal, title="التقديم على صانع محتوى"):
    platform = discord.ui.TextInput(
        label="ماهي المنصة التي تستعملها",
        placeholder="تيك توك / يوتيوب / انستجرام ...",
        max_length=100,
    )
    username = discord.ui.TextInput(
        label="يوزرك بالمنصة التي تستعملها",
        placeholder="@username",
        max_length=100,
    )
    views = discord.ui.TextInput(
        label="عدد المشاهدات على المقطع الواحد بالعادة",
        placeholder="مثال: 5000",
        max_length=100,
    )
    followers = discord.ui.TextInput(
        label="عدد المتابعين",
        placeholder="مثال: 10000",
        max_length=100,
    )
    content_type = discord.ui.TextInput(
        label="نوع المحتوى الذي تقدمه",
        placeholder="فكاهي / تعليمي / عشوائيات ...",
        max_length=100,
    )

    async def on_submit(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="📥 تقديم جديد - صانع محتوى",
            color=discord.Color.green(),
            timestamp=discord.utils.utcnow(),
        )
        embed.set_thumbnail(url=interaction.user.display_avatar.url)
        embed.add_field(name="المنصة", value=self.platform.value, inline=False)
        embed.add_field(name="اليوزر بالمنصة", value=self.username.value, inline=False)
        embed.add_field(name="عدد المشاهدات على المقطع الواحد", value=self.views.value, inline=False)
        embed.add_field(name="عدد المتابعين", value=self.followers.value, inline=False)
        embed.add_field(name="نوع المحتوى", value=self.content_type.value, inline=False)
        embed.set_footer(text=f"ID: {interaction.user.id}")

        channel = interaction.client.get_channel(APPLICATIONS_CHANNEL_ID) or await interaction.client.fetch_channel(
            APPLICATIONS_CHANNEL_ID
        )
        await channel.send(content=f"تقديم من {interaction.user.mention}", embed=embed)

        await interaction.response.send_message(
            "✅ تم إرسال تقديمك بنجاح، انتظر رد الإدارة.", ephemeral=True
        )

    async def on_error(self, interaction: discord.Interaction, error: Exception):
        print(error)
        if not interaction.response.is_done():
            await interaction.response.send_message("❌ صار خطأ، حاول مرة ثانية.", ephemeral=True)


# ====== زر التقديم ======
class ApplyView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)  # عشان الزر يضل شغال حتى بعد إعادة تشغيل البوت

    @discord.ui.button(label="تقديم", style=discord.ButtonStyle.success, custom_id="apply_creator")
    async def apply(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(ApplyModal())


# ====== البوت ======
class Bot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        self.add_view(ApplyView())
        self.tree.copy_global_to(guild=GUILD)
        await self.tree.sync(guild=GUILD)

    async def on_ready(self):
        print(f"✅ البوت شغال: {self.user}")


bot = Bot()


@bot.tree.command(name="eventsapplication", description="تقديم على الفعاليات")
@app_commands.default_permissions(administrator=True)  # الإدارة بس ترسل اللوحة
async def eventsapplication(interaction: discord.Interaction):
    RLM = "\u200f"  # علامة تجبر النص يكون من اليمين لليسار
    embed = discord.Embed(
        title=f"{RLM}التقديم على رتبة صانع محتوى",
        description=(
            f"# {RLM}شروط صانعي المحتوى في حفل ميلاد\n"
            f"- {RLM}ممنوع أن يكون على العضو أي شكوى سابقة\n"
            f"- {RLM}يجب ان يكون نسبة كبيرة من محتواك متعلقه بـ حفل ميلاد\n"
            f"- {RLM}المحتوى في روم المحتوى مراقب من قبل الإدارة وأي مخالفة ستسحب الرتبة مباشرة"
        ),
        color=discord.Color.from_rgb(232, 83, 31),  # برتقالي محمر
    )
    await interaction.response.send_message(embed=embed, view=ApplyView())


bot.run(TOKEN)
