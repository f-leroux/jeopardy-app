import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, ScrollView, Pressable } from 'react-native';
import questionsData from './data/full/jeopardy_questions.json';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

const palette = {
  // Cozy, warmer palette (cream + clay)
  background: '#F6E2D3', // warmer peach-cream
  card: '#F7EDE1',       // soft parchment
  primary: '#C97A63',    // muted clay
  primaryDisabled: '#e3a694', // slightly lighter clay for disabled state
  text: '#3A2E2A',       // warm dark brown
  textSecondary: '#5A4A43',
  border: '#E2D3C6',
  link: '#B86952',       // slightly darker clay
  disabled: '#D6C7BB'
};

function renderTextWithItalics(text) {
  // If explicit <i> tags exist, honor them
  if (text.includes('<i>') || text.includes('</i>')) {
    const parts = text.split(/(<i>|<\/i>)/g);
    const result = [];
    let italic = false;
    parts.forEach((part, index) => {
      if (part === '<i>') {
        italic = true;
      } else if (part === '</i>') {
        italic = false;
      } else if (part !== '') {
        result.push(
          <Text key={`seg-${index}`} style={italic ? styles.italic : undefined}>{part}</Text>
        );
      }
    });
    return result;
  }

  // Otherwise, treat text inside double quotes as italic (dataset convention)
  const result = [];
  let italic = false;
  let buffer = '';
  let segIndex = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (buffer !== '') {
        result.push(
          <Text key={`seg-${segIndex++}`} style={italic ? styles.italic : undefined}>{buffer}</Text>
        );
        buffer = '';
      }
      italic = !italic; // toggle italic when encountering a quote
      continue;
    }
    buffer += ch;
  }
  if (buffer !== '') {
    result.push(
      <Text key={`seg-${segIndex++}`} style={italic ? styles.italic : undefined}>{buffer}</Text>
    );
  }
  return result;
}

export default function App() {
  const [categoryIndex, setCategoryIndex] = useState(() => Math.floor(Math.random() * questionsData.length));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(palette.background);
    NavigationBar.setButtonStyleAsync('dark');
  }, []);

  const category = questionsData[categoryIndex];
  const questionObj = category.questions[questionIndex];

  // Strip quotes only if the entire title is quoted; otherwise leave inner quotes
  const categoryText = category.category.replace(/^"(.*)"$/, '$1');

  const nextQuestion = () => {
    if (questionIndex < category.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  const newCategory = () => {
    setCategoryIndex(Math.floor(Math.random() * questionsData.length));
    setQuestionIndex(0);
    setShowAnswer(false);
  };

  const handleAnswerPress = () => {
    if (questionObj.wiki_slug) {
      Linking.openURL(`https://en.wikipedia.org/wiki/${questionObj.wiki_slug}`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={palette.background} />
      <View style={styles.categoryContainer}>
        <Text style={styles.category} numberOfLines={3} ellipsizeMode="tail">{renderTextWithItalics(categoryText)}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.questionContainer} style={styles.questionScroll} contentInsetAdjustmentBehavior="never">
        <Text style={styles.question}>{renderTextWithItalics(questionObj.q)}</Text>
      </ScrollView>
      <ScrollView
        contentContainerStyle={styles.answerContainer}
        style={[styles.answerScroll, !showAnswer && styles.hidden]}
        contentInsetAdjustmentBehavior="never"
        pointerEvents={showAnswer ? 'auto' : 'none'}
      >
        <TouchableOpacity onPress={handleAnswerPress} disabled={!questionObj.wiki_slug}>
          <Text
            style={[
              styles.answer,
              { color: questionObj.wiki_slug ? palette.link : palette.text }
            ]}
          >
            {renderTextWithItalics(questionObj.a)}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.buttonsRow}>
        <Pressable
          style={({pressed}) => [styles.button, questionIndex === 0 && styles.disabledButton, pressed && styles.buttonPressed]}
          onPress={prevQuestion}
          disabled={questionIndex === 0}
        >
          <Text style={[styles.buttonText, styles.arrowText]}>←</Text>
        </Pressable>
        <Pressable style={({pressed}) => [styles.button, pressed && styles.buttonPressed]} onPress={() => setShowAnswer(!showAnswer)}>
          <Text style={styles.buttonText} numberOfLines={2}>
            {showAnswer ? 'Hide\nAnswer' : 'Show\nAnswer'}
          </Text>
        </Pressable>
        <Pressable
          style={({pressed}) => [styles.button, questionIndex === category.questions.length - 1 && styles.disabledButton, pressed && styles.buttonPressed]}
          onPress={nextQuestion}
          disabled={questionIndex === category.questions.length - 1}
        >
          <Text style={[styles.buttonText, styles.arrowText]}>→</Text>
        </Pressable>
      </View>
      <View style={styles.newCategory}>
        <Pressable style={({pressed}) => [styles.button, styles.newCategoryButton, pressed && styles.buttonPressed]} onPress={newCategory}>
          <Text style={styles.buttonText} numberOfLines={2}>New{"\n"}Category</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 100,
    paddingBottom: 40,
    backgroundColor: palette.background
  },
  categoryContainer: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  category: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: palette.text,
    marginBottom: 0
  },
  questionScroll: {
    height: 200,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    marginTop: 10,
    marginBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden'
  },
  questionContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  question: { fontSize: 20, textAlign: 'center', color: palette.textSecondary },
  separator: { borderBottomWidth: 1, borderBottomColor: palette.border, marginVertical: 10 },
  answer: { fontSize: 20, textAlign: 'center', color: palette.text },
  italic: { fontStyle: 'italic' },
  answerScroll: {
    height: 100,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    marginTop: 0,
    marginBottom: 12,
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden'
  },
  answerContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  hidden: { opacity: 0 },
  buttonsRow: { flexDirection: 'row', marginBottom: 2 },
  button: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: palette.primary,
    borderRadius: 8,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledButton: { backgroundColor: palette.primaryDisabled },
  buttonText: { color: palette.card, textAlign: 'center', fontSize: 18 },
  arrowText: { fontSize: 54, lineHeight: 60, fontWeight: '800', marginTop: -18 },
  newCategory: { marginTop: 5 },
  newCategoryButton: {
    height: 70,
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPressed: { backgroundColor: '#c97a63' + 'dd' }
});
