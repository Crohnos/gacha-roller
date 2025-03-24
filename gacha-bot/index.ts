// Discord bot for Gacha Roller
import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Attachment,
  AttachmentBuilder,
  CommandInteraction
} from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_BOT_ID;
const API_URL = 'http://localhost:3000'; // Backend API URL

// Ensure token is provided
if (!token || !clientId) {
  throw new Error('Missing DISCORD_BOT_TOKEN or DISCORD_BOT_ID in environment variables');
}

// Create a new client instance
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ] 
});

// Define color based on rarity
const rarityColors = {
  common: 0x808080, // Gray
  rare: 0x0099ff,   // Blue
  epic: 0x9900ff,   // Purple
  legendary: 0xffcc00, // Gold
  mythic: 0xff0000    // Red
};

// When the client is ready, run this code
client.once('ready', () => {
  console.log('Gacha Roller Bot is ready!');
});

// Handle commands
client.on('interactionCreate', async (interaction) => {
  // Ignore non-command interactions
  if (!interaction.isCommand() && !interaction.isButton()) return;

  try {
    // Handle buttons
    if (interaction.isButton()) {
      const [action, userId] = interaction.customId.split(':');
      
      // Check if the user clicking the button is the one who rolled
      if (userId !== interaction.user.id) {
        return interaction.reply({ 
          content: 'This button is not for you!',
          ephemeral: true
        });
      }

      // Collection button
      if (action === 'collection') {
        await handleViewCollection(interaction);
      }
      
      return;
    }

    // Handle commands
    switch (interaction.commandName) {
      case 'roll':
        await handleRoll(interaction);
        break;
      case 'collection':
        await handleViewCollection(interaction);
        break;
      case 'leaderboard':
        await handleLeaderboard(interaction);
        break;
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    
    // Check if the interaction was already replied to
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: 'There was an error processing your request!',
        ephemeral: true
      });
    } else {
      await interaction.reply({ 
        content: 'There was an error processing your request!',
        ephemeral: true
      });
    }
  }
});

// Handle the roll command
async function handleRoll(interaction: CommandInteraction) {
  // Defer the reply to give us time to process
  await interaction.deferReply();

  try {
    // Call the API to roll a card
    const response = await axios.post(`${API_URL}/roll`, {
      user_id: interaction.user.id,
      username: interaction.user.username
    });

    const { card_id, image_path, description, css, rarity, character, enhancements } = response.data;
    
    // Get the full image path
    const fullImagePath = path.join(API_URL, image_path);
    
    // Create an embed for the card
    const embed = new EmbedBuilder()
      .setTitle(`${character} (${rarity.toUpperCase()})`)
      .setDescription(description)
      .setColor(rarityColors[rarity as keyof typeof rarityColors] || 0x808080)
      .setImage(`attachment://card.png`)
      .setFooter({ text: `Card #${card_id}` });
    
    // Add enhancements field if available
    if (enhancements && enhancements.length > 0) {
      embed.addFields({
        name: 'Enhancements',
        value: enhancements.join(', ')
      });
    }
    
    // Fetch the image
    const imageResponse = await axios.get(fullImagePath, { responseType: 'arraybuffer' });
    const attachment = new AttachmentBuilder(Buffer.from(imageResponse.data), { name: 'card.png' });
    
    // Create buttons
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`collection:${interaction.user.id}`)
          .setLabel('View My Collection')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Send the reply with the embed and image
    await interaction.editReply({
      content: `<@${interaction.user.id}> rolled a ${rarity.toUpperCase()} card!`,
      embeds: [embed],
      files: [attachment],
      components: [row]
    });
  } catch (error) {
    console.error('Error rolling card:', error);
    
    await interaction.editReply({
      content: 'The AI is recalibrating—try again!'
    });
  }
}

// Handle the collection command
async function handleViewCollection(interaction: CommandInteraction) {
  // Defer the reply
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply();
  }
  
  try {
    // Fetch user's collection from API
    const response = await axios.get(`${API_URL}/collection/${interaction.user.id}`);
    const cards = response.data;
    
    if (cards.length === 0) {
      const reply = {
        content: "You don't have any cards yet! Use `/roll` to get your first card.",
        ephemeral: true
      };
      
      if (interaction.deferred) {
        await interaction.editReply(reply);
      } else {
        await interaction.followUp(reply);
      }
      return;
    }
    
    // Group cards by rarity
    const cardsByRarity: Record<string, any[]> = {};
    cards.forEach((card: any) => {
      if (!cardsByRarity[card.rarity]) {
        cardsByRarity[card.rarity] = [];
      }
      cardsByRarity[card.rarity].push(card);
    });
    
    // Create an embed for the collection summary
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username}'s Collection`)
      .setDescription(`You have collected ${cards.length} cards!`)
      .setColor(0x9900ff);
    
    // Add fields for each rarity
    const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common'];
    rarityOrder.forEach(rarity => {
      if (cardsByRarity[rarity] && cardsByRarity[rarity].length > 0) {
        embed.addFields({
          name: `${rarity.toUpperCase()} (${cardsByRarity[rarity].length})`,
          value: cardsByRarity[rarity]
            .slice(0, 5) // Show at most 5 cards per rarity
            .map(card => `• ${card.character} (#${card.card_id})`)
            .join('\n') +
            (cardsByRarity[rarity].length > 5 
              ? `\n...and ${cardsByRarity[rarity].length - 5} more` 
              : '')
        });
      }
    });
    
    const reply = { embeds: [embed] };
    
    if (interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.followUp(reply);
    }
  } catch (error) {
    console.error('Error fetching collection:', error);
    
    const errorReply = { 
      content: 'Could not retrieve your collection. Please try again later!',
      ephemeral: true 
    };
    
    if (interaction.deferred) {
      await interaction.editReply(errorReply);
    } else {
      await interaction.followUp(errorReply);
    }
  }
}

// Handle the leaderboard command
async function handleLeaderboard(interaction: CommandInteraction) {
  await interaction.deferReply();
  
  try {
    // Fetch leaderboard from API
    const response = await axios.get(`${API_URL}/leaderboard`);
    const leaderboard = response.data;
    
    if (leaderboard.length === 0) {
      await interaction.editReply({
        content: "No one has rolled any cards yet!"
      });
      return;
    }
    
    // Create an embed for the leaderboard
    const embed = new EmbedBuilder()
      .setTitle('Gacha Roller Leaderboard')
      .setDescription('Top collectors ranked by rarity points')
      .setColor(0xffcc00);
    
    // Add fields for top players
    const leaderboardText = leaderboard
      .map((entry: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        return `${medal} **${entry.username}** - ${entry.points} points (${entry.total_cards} cards)`;
      })
      .join('\n');
    
    embed.addFields({
      name: 'Top Collectors',
      value: leaderboardText || 'No data available'
    });
    
    await interaction.editReply({
      embeds: [embed]
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    
    await interaction.editReply({
      content: 'Could not retrieve the leaderboard. Please try again later!'
    });
  }
}

// Register slash commands
async function registerCommands() {
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll for a new AI character card'),
      
      new SlashCommandBuilder()
        .setName('collection')
        .setDescription('View your card collection'),
      
      new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top card collectors')
    ];
    
    const rest = new REST({ version: '10' }).setToken(token);
    
    console.log('Started refreshing application (/) commands.');
    
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Register commands and log in
registerCommands();
client.login(token);