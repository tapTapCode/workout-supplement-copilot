import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) var dismiss
    @State private var email = ""
    @State private var password = ""
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                VStack(spacing: 24) {
                    Spacer()
                    
                    VStack(spacing: 8) {
                        Image(systemName: "waveform")
                            .font(.system(size: 40, weight: .thin))
                            .foregroundColor(.white)
                        
                        Text("Sign In")
                            .font(.title3)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                    }
                    
                    VStack(spacing: 14) {
                        TextField("Email", text: $email)
                            .textFieldStyle(.plain)
                            .padding(14)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(8)
                            .foregroundColor(.white)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                        
                        SecureField("Password", text: $password)
                            .textFieldStyle(.plain)
                            .padding(14)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(8)
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal)
                    
                    Button(action: {
                        authViewModel.signInWithEmail(email: email, password: password)
                        dismiss()
                    }) {
                        Text("Sign In")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.white)
                            .cornerRadius(8)
                    }
                    .padding(.horizontal)
                    
                    Button(action: {}) {
                        Text("Forgot Password?")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.6))
                    }
                    
                    Spacer()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .foregroundColor(.white)
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
